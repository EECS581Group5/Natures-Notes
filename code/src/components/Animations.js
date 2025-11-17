import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import rainLottie from "../lottieAnimations/Rain background animation.lottie";

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

export default RainAnimation;