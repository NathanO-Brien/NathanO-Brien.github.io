---
title: "Suborbital Rocket Body Tracking with EKF/UKF/IMM"

summary: "Simulated tracking of a suborbital rocket body using two angles-only geostationary infrared sensors, comparing an Extended Kalman Filter, an Unscented Kalman Filter, and a two-model Interacting Multiple Model filter in MATLAB. A sensor geometry sweep showed that triangulation geometry affects tracking accuracy more than filter architecture does."

details: "This was my final project for Georgia Tech's AE6505 Kalman Filtering course. It builds directly on a planar thrust vector steering law I derived in a prior Optimal Control course. I generalized that project's planar guidance solution into a full spherical-Earth truth trajectory. I chose angles-only GEO tracking because it forces a real triangulation problem, similar to how actual space-based early-warning systems like SBIRS operate, which ties into my broader interest in space security research. All three filters share a 9-state model with a Singer acceleration process to account for unmodeled thrust, and none of them ever see the guidance law, only noisy azimuth/elevation measurements corrupted by realistic sensor dropout and Earth-limb occlusion. The sections below walk through how each filter is built, why I made the design choices I did, and what the geometry sweep revealed about why range is so hard to observe from a fixed pair of sensors."

role: "Solo project"
startDate: "2026-02"
endDate: "2026-04"
status: "complete"
tags: ["Kalman Filtering", "Estimation Theory", "Orbit Determination", "MATLAB"]
links: []
reportPdf: "/docs/kf-project-final-report.pdf"
thumbnail: "/images/thumbnails/kf-project-thumbnail.png"
gallery:
  - type: "image"
    src: "/images/kf-project/scenario-geometry.png"
    alt: "Earth spheroid with the launch-centered coordinate frame and the truth boost trajectory"
  - type: "image"
    src: "/images/kf-project/geo-sensor-constellation.png"
    alt: "Earth spheroid with the GEO orbit ring and both sensor locations marked"
  - type: "image"
    src: "/images/kf-project/launch-plane-physics.png"
    alt: "Launch-plane distance, speed, and injected truth acceleration disturbance through burnout"
  - type: "image"
    src: "/images/kf-project/measured-az-el.png"
    alt: "Measured azimuth and elevation histories from both GEO sensors"
  - type: "image"
    src: "/images/kf-project/filter-comparison-position.png"
    alt: "EKF, UKF, and IMM position error compared directly against each other"
  - type: "image"
    src: "/images/kf-project/filter-comparison-velocity.png"
    alt: "EKF, UKF, and IMM velocity error compared directly against each other"
order: 0
---

## Scenario and measurement model

The scenario I built uses two idealized geostationary infrared sensors, loosely modeled on the real SBIRS constellation, to track a rocket body throughout a suborbital trajectory. The rocket launches from Jiuquan (CN) on a realistic profile: a 2.525g thrust-to-weight ratio, a 320-second burn, then a ballistic coast to a Pacific splashdown around 877 seconds after launch. Both sensors are angles-only. They are modelled to report azimuth and elevation at 1 Hz with 0.01° of noise and never see range directly. 

<figure>
<img src="/images/kf-project/geo-sensor-constellation.png" alt="Earth spheroid with the GEO orbit ring and both sensor locations marked, showing the two geostationary satellites providing angles-only measurements" />
<figcaption>The two GEO sensors that actually produce the measurements, shown in their orbital positions around the Earth.</figcaption>
</figure>

<figure>
<img src="/images/kf-project/scenario-geometry.png" alt="Earth spheroid showing the launch-centered coordinate frame and the truth boost trajectory arcing from Jiuquan" />
<figcaption>The launch-centered frame I built the truth trajectory in, with the boost arc shown against the Earth.</figcaption>
</figure>

I didn't want a clean, idealized sensor model, so I added two sources of realism that show up throughout the results below. Each sensor has an independent 10% chance of dropping a given epoch's measurement, and I added a hard Earth-limb occlusion check: if the straight line between a sensor and the target passes through the Earth, then that sensor cannot see the target. Both effects matter more than they might sound like they should, and the occlusion check in particular turns out to drive most of the interesting behavior in the geometry sweep later on.

<figure>
<img src="/images/kf-project/measured-az-el.png" alt="Measured azimuth and elevation histories from both GEO sensors, showing the raw noisy angle data each filter actually receives" />
<figcaption>What the filters actually see: raw, noisy azimuth and elevation from each sensor. No range, ever.</figcaption>
</figure>

<figure>
<img src="/images/kf-project/sensor-dropout.png" alt="IR sensor reporting availability over time, showing gaps from the modeled 10 percent random dropout" />
<figcaption>Reporting gaps from the 10% independent dropout model, on top of the deterministic occlusion check.</figcaption>
</figure>

The truth trajectory itself is more than a straight-line approximation. It comes out of the steering law I mention above, and the resulting motion has real, physically meaningful structure: distance and speed grow the way an actual boosting vehicle's would, and the disturbance I injected into the truth acceleration to make the tracking problem non-trivial is visible directly in the launch-plane data.

<figure>
<img src="/images/kf-project/launch-plane-physics.png" alt="Launch-plane distance, speed, and injected truth acceleration disturbance plotted through burnout" />
<figcaption>Truth-trajectory physics in the launch plane: distance and speed building through boost, and the injected disturbance the filters have to track without ever seeing it directly.</figcaption>
</figure>

None of the three filters below ever see the steering law that generated this trajectory. They only ever get the noisy angle measurements shown above, and have to infer everything else from scratch. Each filter assumes a two-body orbital dynamics model with an extra acceleration term folded into the state itself. Position and velocity propagate under Earth's gravity, and a third state absorbs whatever additional acceleration (thrust included) is actually acting on the vehicle at each instant. That third term is deliberately generic rather than shaped like a rocket's thrust curve. It's just an acceleration the filter is free to estimate and let evolve as the data demands, which is the piece I describe in more detail below.

## How each filter works

All three filters share the same 9-state model: position, velocity, and an unknown acceleration term, all in ECI coordinates. The acceleration is the interesting part. I modeled it as a Singer process, a mean-reverting, first-order Gauss-Markov process, instead of white noise or an explicit thrust model. My reasoning: thrust is physically real and temporally correlated from one instant to the next, but its magnitude and direction are completely unknown to a passive observer. White noise would let the filter believe acceleration can change instantaneously, which is too optimistic. An explicit thrust model would require knowing the guidance law, which defeats the point. The Singer process sits in between, letting the acceleration estimate drift smoothly and track whatever the true steering profile happens to be doing.

I used two Singer parameter sets, one tuned for boost (long correlation time, large process noise) and one for coast (short, small), and I applied the process noise anisotropically relative to the launch plane. The steering law keeps essentially all of the thrust in-plane, so nothing physically pushes the vehicle cross-plane. My first version used isotropic noise and it visibly hurt performance, so splitting it by plane was one of the more important tuning decisions in the whole project. Computing that anisotropic process-noise matrix exactly, rather than approximating it, uses the Van Loan method (matrix-exponential augmentation):

```matlab
function Q_d = compute_singer_Q(tau, sigma, dt, n_hat, sigma_normal)
    n     = 9;                       % state dimension
    alpha = 1 / tau;                 % Singer decay rate

    q_c_in  = 2 * sigma^2        / tau;   % in-plane noise PSD
    q_c_out = 2 * sigma_normal^2 / tau;   % cross-plane noise PSD

    P_in  = eye(3) - n_hat * n_hat';   % projection onto launch plane
    P_out = n_hat  * n_hat';           % projection onto plane normal

    Q_c   = q_c_in * P_in + q_c_out * P_out;

    F_c   = [zeros(3)   eye(3)           zeros(3)      ;
             zeros(3)   zeros(3)         eye(3)         ;
             zeros(3)   zeros(3)   -alpha * eye(3)      ];
    G_c   = [zeros(6, 3); eye(3)];
    GQG   = G_c * Q_c * G_c';

    M     = [-F_c  GQG ; zeros(n)  F_c'] * dt;   % Van Loan augmented matrix
    eM    = expm(M);

    Phi_d = eM(n+1:end, n+1:end)';      % discrete state transition
    Q_d   = Phi_d * eM(1:n, n+1:end);   % discrete process noise
    Q_d   = 0.5 * (Q_d + Q_d');         % enforce symmetry
end
```

### Extended Kalman Filter

The EKF is my baseline case. It propagates the nonlinear dynamics with RK4, discretizes an analytic Jacobian via the matrix exponential for the covariance, and uses a Joseph-form covariance update for numerical stability. Each sensor's measurements go through a per-sensor χ² gate before they're allowed to correct the state, which keeps one bad reading from one sensor from corrupting the fused estimate:

```matlab
S_i   = H_i * P_prior * H_i' + R_cell{i};   % innovation covariance for sensor i
nis_i = nu_i' * (S_i \ nu_i);               % normalized innovation squared
if nis_i > gate_threshold
    gated_hist(i, k) = true;
    continue;   % discard this sensor's measurement for step k
end
```

Phase detection is fully autonomous. I never tell the filter when burnout happens; it watches the magnitude of its own acceleration estimate and latches from boost to coast once that estimate has first risen above, then fallen back below, half of Earth's surface gravity. The latch is one-way, so measurement noise can't flip it back and forth once it's committed to coast:

```matlab
a_norm = norm(x_hat(7:9));   % magnitude of the acceleration estimate

if in_boost
    % Remain in boost until the estimate has risen and then fallen.
    if a_norm < a_threshold && any(x_hist(7,:).^2 + x_hist(8,:).^2 + x_hist(9,:).^2 > a_threshold^2)
        in_boost = false;   % latch to coast -- no going back
    end
end
```

That works well for a single boost-then-coast profile, but it would fall apart on a vehicle that re-ignites, which is exactly the gap the IMM below is built to close.

<figure>
<img src="/images/kf-project/ekf-position-error.png" alt="EKF ECI position error with 3-sigma bounds, showing convergence after detection and a visible kink at the boost-to-coast transition" />
<figcaption>EKF position error settling in after acquisition, with the phase-latch transition visible as a small kink partway through.</figcaption>
</figure>

### Unscented Kalman Filter

The UKF uses the exact same dynamics, measurement model, and tuning as the EKF. The only difference is that it pushes 19 sigma points through the true nonlinear propagation and the true nonlinear azimuth/elevation measurement function instead of linearizing either one. I built it specifically as a check on whether the EKF's linearization was costing anything.

The answer, measured directly, is no. The EKF and UKF land on numerically indistinguishable 3D position RMSE, 1.621 km versus 1.621 km, differing by under a meter. The azimuth/elevation measurement function just isn't curved enough over a one-second interval for the difference between linearizing it and sampling it exactly to matter here.

<figure>
<img src="/images/kf-project/ukf-innovations.png" alt="UKF azimuth and elevation innovations, centered on zero as expected for a consistent, well-tuned filter" />
<figcaption>UKF innovations sitting on zero mean, which is what a properly tuned, consistent filter should look like.</figcaption>
</figure>

I still think the UKF earned its place in the project. Confirming that a cheaper, linearized filter loses nothing here is itself a useful result, and it's not something I could have claimed with any confidence without actually building the sigma-point version and comparing.

### Interacting Multiple Model

The IMM runs two parallel Singer-EKF sub-filters, one tuned for boost and one for coast, and combines them every step through the standard four-stage cycle: mix the previous states using a Markov transition matrix, run one predict/update cycle per sub-filter, score each sub-filter's measurement likelihood, then fuse the posteriors by probability. I built it to replace the EKF's hard threshold latch with a smooth, probabilistic phase transition, so the reported covariance never has a discontinuity right at burnout.

I started the model probabilities at 99% boost and 1% coast, and made the Markov matrix's coast state absorbing, meaning zero probability of transitioning back to boost. That's both a physical choice (rocket motors don't restart mid-flight in this scenario) and a numerical one (it keeps the large boost-phase process noise from leaking back into the fused covariance once burnout is over). I tuned the boost-to-boost transition probability so the filter's expected dwell time in boost, about 294 seconds, roughly matches the true 320-second burn without overcommitting to an exact number:

```matlab
imm_params.mu0       = [0.99; 0.01];       % [boost prob; coast prob] at t=0
imm_params.P_markov  = [0.9966  0.0034;    % boost -> {boost, coast}
                        0.0000  1.0000];   % coast is absorbing
```

Scoring each sub-filter and turning those scores into updated model probabilities is the other half of the IMM, and it has to happen in log space, since the raw Gaussian likelihoods underflow to zero almost immediately on a real trajectory:

```matlab
% Gaussian log-likelihood of each sub-filter's accepted measurements:
%   log Lambda_j = -(1/2) m log(2*pi) - (1/2) log|S_j| - (1/2) NIS_j
if m_j > 0
    nis_j     = nu_j' * (S_j \ nu_j);
    L_chol    = chol(S_j, 'upper');
    log_det_S = 2 * sum(log(diag(L_chol)));   % stable log-determinant via Cholesky
    log_L(j)  = -0.5 * m_j * log(2 * pi) - 0.5 * log_det_S - 0.5 * nis_j;
else
    log_L(j) = 0;   % no measurements this step -> uninformative likelihood
end

% Bayes' rule in log space, with the log-sum-exp trick (subtract the max
% before exponentiating) so the largest term never overflows:
log_Lambda = log_L + log(c);
log_Lambda = log_Lambda - max(log_Lambda);
Lambda     = exp(log_Lambda);
mu_new     = Lambda / sum(Lambda);   % normalized model probabilities
```

<figure>
<img src="/images/kf-project/imm-model-probabilities.png" alt="IMM model probabilities over time, showing the boost probability decaying smoothly to zero and the coast probability rising to one around burnout" />
<figcaption>The IMM's mode probabilities crossing over near burnout. No hard switch, just a smooth handoff between the two sub-filters.</figcaption>
</figure>

That smoothness comes at a cost: the coast probability takes 80 to 85 seconds to fully saturate, versus the EKF's hard commit in 5 to 10 seconds. In exchange, the IMM edges out the EKF slightly on raw accuracy, 1.607 km versus 1.621 km 3D position RMSE, under 1% better. I don't think that small accuracy edge is really the point, though. The real advantage is that the IMM's covariance never jumps at the phase boundary the way a hard-switched filter's does, which matters a lot more if you're feeding this into something downstream that trusts the reported uncertainty.

Putting all three side by side makes the story clear: the EKF and UKF lines are essentially on top of each other throughout, while the IMM tracks marginally tighter, especially through the transition region where the other two show a small kink.

<figure>
<img src="/images/kf-project/filter-comparison-position.png" alt="EKF, UKF, and IMM ECI position error overlaid on the same axes for direct comparison" />
<figcaption>Position error for all three filters overlaid. EKF and UKF nearly coincide; the IMM's smoother transition is the visible difference.</figcaption>
</figure>

<figure>
<img src="/images/kf-project/filter-comparison-velocity.png" alt="EKF, UKF, and IMM ECI velocity error overlaid on the same axes for direct comparison" />
<figcaption>Same comparison for velocity error. The pattern holds: EKF and UKF track together, IMM edges ahead near the transition.</figcaption>
</figure>

## Why this scenario, and what the geometry sweep found

I picked angles-only GEO tracking specifically because it forces a triangulation problem, and I wanted to find out how much a real triangulation problem actually depends on where you put your sensors. I found that sensor geometry affects tracking accuracy more than the choice of filter architecture does.

To test that, I held one sensor fixed and swept the second through 72 geometries, every 5° of longitude separation from 0° to 355°, rerunning the full simulation at each one. Five regimes fall out of the sweep:

1. **Near-coincident (0-5°):** the two sensors are almost redundant, and RMSE sits close to the single-sensor floor since there's barely any triangulation baseline at all.
2. **Sweet spot (10-85°):** RMSE stays under 2 km and barely moves across this whole range. The nominal 45.2° separation I used for all the filter-comparison plots above lives right in the middle of this band.
3. **Occlusion onset (90-120°):** the second sensor starts getting blocked by the Earth's limb for parts of the trajectory, and RMSE climbs sharply as that happens.
4. **Full occlusion (120-275°):** the second sensor is blocked most of the time, and RMSE plateaus around 237 to 249 km, two orders of magnitude worse than the sweet spot.
5. **Recovery (275-355°):** RMSE collapses back down, and noticeably faster than it climbed going in.

<figure>
<img src="/images/kf-project/rmse-vs-separation.png" alt="3D position RMSE versus GEO sensor separation angle across all 72 swept geometries, showing the five regimes described in the text" />
<figcaption>RMSE across all 72 swept geometries. The plateau in the middle is the full-occlusion band; everything outside it is the sweet spot.</figcaption>
</figure>

The occlusion band lines up exactly with how often the second sensor is actually reporting. Sensor availability drops sharply right where RMSE starts climbing, and stays low across the same 120-275° stretch where RMSE plateaus.

<figure>
<img src="/images/kf-project/sensor-availability-vs-separation.png" alt="Sensor availability versus separation angle, showing the availability drop across the same separation range where RMSE plateaus" />
<figcaption>Second-sensor availability by geometry. It tracks the RMSE curve almost exactly, which is the first hint that this is an occlusion story, not a filter-tuning story.</figcaption>
</figure>

That asymmetry between how fast RMSE rises versus how fast it recovers was the most interesting thing I found in the whole sweep. Here's my take: when the second sensor drops out, the along-line-of-sight, or depth, error grows faster than the filter's own uncertainty estimate widens. The Kalman gain in the depth direction is inherited from the still-tight, dual-sensor covariance right before the dropout, so it stays small even as the true error balloons, which lets the estimate overshoot to roughly 210 km of depth error before settling onto a ~146 km single-sensor plateau. When the second sensor comes back into view, the filter's covariance is already large in the depth direction from having spent time with only one sensor, so the very next triangulating measurement produces a large Kalman gain there and the correction snaps back almost immediately. The filter recovers fast because it already "knows" it's uncertain and is ready to believe the new information.

That behavior traces directly back to the occlusion and dropout logic from the scenario section:

```matlab
% Earth-limb visibility: find the point on the sensor-to-target segment
% closest to Earth's center; if that point is inside the Earth, the
% line of sight is blocked.
los_vec = target_ecef(:, k) - sensor_ecef;
t_min   = -dot(sensor_ecef, los_vec) / dot(los_vec, los_vec);
t_min   = max(0.0, min(1.0, t_min));   % clamp to the segment itself
if norm(sensor_ecef + t_min * los_vec) < params.r_earth
    continue;   % LOS intersects Earth -- sensor cannot see target
end

% Independent per-sensor dropout, applied only if the geometric
% visibility check above already passed.
if dropout_draws(i, k) < params.sensors(i).dropout_probability
    continue;
end
```

The actual triangulation geometry backs this up too. I computed the angle at which the two sensors' lines of sight cross at the target, and it collapses toward zero across the same occlusion band, meaning the two remaining lines of sight (when a second measurement is available at all) become nearly parallel and can't localize depth precisely even when they do intersect.

<figure>
<img src="/images/kf-project/los-intersection-angle.png" alt="Dual-sensor line-of-sight intersection angle versus separation angle" />
<figcaption>The line-of-sight crossing angle by geometry. Near the sweet spot the two sightlines cross close to perpendicular; deep in the occlusion band, on the rare epochs both sensors do report, they're nearly parallel.</figcaption>
</figure>

Decomposing the position error into along-line-of-sight and cross-line-of-sight components confirms this is entirely a depth story. Cross-line-of-sight error stays under 5 km regardless of geometry, no matter how bad the occlusion band gets.

<figure>
<img src="/images/kf-project/range-blindness-decomposition.png" alt="Range-blindness causal decomposition, tying RMSE directly to the single-sensor epoch fraction and along-line-of-sight error" />
<figcaption>Decomposing the error confirms it: the RMSE blowup is entirely a depth-direction problem, not a general degradation.</figcaption>
</figure>

One more check mattered to me before I trusted any of this: filter consistency. The NIS ratio, which measures whether a filter's reported uncertainty actually matches its real error, stays within ±4.5% of the ideal value across all 72 geometries. That tells me the Singer tuning itself holds up regardless of geometry, and that the RMSE blowup in the occlusion band is a genuine observability limit rather than a badly tuned filter failing in the backend.
