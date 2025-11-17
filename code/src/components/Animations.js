import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import rainLottie from "../lottieAnimations/Rain background animation.lottie";
import snowLottie from "../lottieAnimations/Snow Off white.lottie";

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

export { RainAnimation, SnowAnimation };