import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import rainLottie from "../lottieAnimations/Rain background animation.lottie";
import snowLottie from "../lottieAnimations/Snow Off white.lottie";
import fogLottie from "../lottieAnimations/Fog  Smoke.lottie"; // There are two spaces between Fog and Smoke in the filename. Why?? IDK
import cloudsLottie from "../lottieAnimations/clouds loop.lottie";

function RainAnimation() {
    return (
        <DotLottieReact
            src={rainLottie}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
            className="rain-animation"
        />
    );
};

function SnowAnimation() {
    return (
        <DotLottieReact
            src={snowLottie}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
            className="snow-animation"
        />
    );
};

function FogAnimation() {
    return (
        <DotLottieReact
            src={fogLottie}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
            className="fog-animation"
        />
    );
};

function CloudsAnimation() {
    return (
        <DotLottieReact
            src={cloudsLottie}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
            className="clouds-animation"
        />
    );
};

export { RainAnimation, SnowAnimation, FogAnimation, CloudsAnimation };