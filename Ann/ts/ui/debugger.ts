import { gsap } from "gsap";

import type { Engine } from "@babylonjs/core/Engines/engine";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";

interface DebuggerUIConfig {
  rootSelector: string;

  bjsEngine: Engine | WebGPUEngine;
}

export class DebuggerUI {
  toggled: boolean;

  constructor(config: DebuggerUIConfig) {
    //Init Start
    this.toggled = false;

    const root = document.querySelector(config.rootSelector) as HTMLElement;

    root.innerHTML = `
      <div class="debugger-top">
        <div class="performance">
          <div class="label">Performance</div>

          <!-- Values updated by editor.js -->
          <div id="debugger-fps" class="value"></div>
          <div id="debugger-deltaFrameTime" class="value"></div>
        </div>

        <button id="debugger-toggle-btn">
          <!-- Modified - shrink by Barudak Lier on IconScout[iconscout.com] -->
          <svg viewBox="0 0 32 32">
            <g transform-origin="center" transform="scale(0.6)">
              <path d="M18.09268 12.75058c.10934.68189.7718 1.20826 1.45618 1.20992 0 0 6.23915 0 6.23915 0 1.96865-.03352 1.97283-2.96501-.00007-2.99901.00007 0-2.61919 0-2.61919 0l7.89193-7.89241c.58574-.58574.58574-1.53514 0-2.12039-.58574-.58574-1.53465-.58574-2.12039 0l-7.89193 7.89193V6.22136c-.03198-1.96805-2.96586-1.97294-2.99901.00007 0-.00007 0 6.23957 0 6.23957C18.06271 12.55742 18.07039 12.65393 18.09268 12.75058z" />

              <path d="M12.46136 4.72186c-.82785 0-1.49951.67116-1.49951 1.49951v2.61925L3.06993.94869C1.66016-.41771-.42469 1.6472.94959 3.06913.94954 3.06908 8.84146 10.9615 8.84146 10.9615H6.22221c-1.96795.03183-1.97294 2.96597.00007 2.99901-.00007 0 6.23909 0 6.23909 0 .32008-.0024.63198-.11599.88947-.30374.38254-.28355.58459-.72834.61001-1.19577.00003.00001.00003-6.23963.00003-6.23963C13.96087 5.39302 13.28921 4.72186 12.46136 4.72186z" />

              <path d="M13.91761 19.25838c-.11004-.69488-.77012-1.18987-1.45625-1.21033.00001-.00002-6.23914-.00002-6.23914-.00002-1.96886.03368-1.97269 2.96497.00007 2.99901-.00007 0 2.61919 0 2.61919 0l-7.89193 7.89242c-.58574.58574-.58574 1.53514 0 2.12039.58574.58574 1.53465.58574 2.12039 0l7.89193-7.89193v2.61925c.03191 1.96815 2.96594 1.97282 2.99901-.00007 0 .00007 0-6.23957 0-6.23957C13.94758 19.45124 13.93976 19.35494 13.91761 19.25838z" />

              <path d="M23.16877 21.04704h2.61925c1.96806-.03177 1.97281-2.96605-.00007-2.99901.00007 0-6.23909 0-6.23909 0-.39021.02996-.78011.15456-1.05177.45031-.29372.27176-.41828.65998-.44772 1.0492-.00002-.00001-.00002 6.23963-.00002 6.23963.03377 1.96893 2.96488 1.97271 2.99901-.00006 0 .00006 0-2.61919 0-2.61919l7.89193 7.89193c.58574.58574 1.53465.58574 2.12039 0 .58574-.58526.58574-1.53465 0-2.12039L23.16877 21.04704z" />
            </g>
          </svg>
        </button>
      </div>

      <div class="debugger-body">
        <!-- Values injected by editor.js -->

        <div class="API">
          <div class="label">API</div>
          <div id="debugger-api" class="value"></div>
        </div>
      </div>
    `;
    //Init End

    //API Start
    const apiValue = root.querySelector("#debugger-api")!;
    apiValue.innerHTML = config.bjsEngine.isWebGPU ? "WebGPU" : `WebGL&nbsp;${(config.bjsEngine as Engine).webGLVersion}`;
    //API End

    //Performance Start
    const fpsValue = document.getElementById("debugger-fps")!;
    const frameTimeValue = document.getElementById("debugger-deltaFrameTime")!;

    setInterval(() => {
      const fps = config.bjsEngine.getFps();

      frameTimeValue.innerHTML = `∆&nbsp;${(1000 / fps).toFixed(2)}&nbsp;ms`;
      fpsValue.innerHTML = `${Math.round(fps)}&nbsp;fps`;
    }, 1000);
    //Performance End

    //Collapsing/Expanding Start
    const debugToggleBtn = document.getElementById("debugger-toggle-btn");

    const debugPerformance = root.querySelector(".performance") as HTMLElement;
    const debugBody = root.querySelector(".debugger-body") as HTMLElement;

    const toggleChevronGChildren = Array.from(root.querySelector("g")!.children);

    gsap.set(toggleChevronGChildren, { transformOrigin: "50% 50%" })

    debugPerformance.style.overflow = "hidden";
    debugBody.style.overflow = "hidden";

    debugToggleBtn!.addEventListener("click", () => {
      this.toggled = !this.toggled;

      gsap.to([debugPerformance, debugBody], {
        height: this.toggled ? "auto" : 0,
        width: this.toggled ? "auto" : 0,
        opacity: this.toggled ? 1 : 0,
        duration: 0.4,
        ease: "circ.inOut",
        overwrite: "auto",
      });

      gsap.to(debugToggleBtn, {
        scale: this.toggled ? 1 : 1.2,
        x: this.toggled ? 0 : -4,
        y: this.toggled ? 0 : 4,
        duration: 0.4,
        ease: "circ.inOut",
        overwrite: "auto"
      });

      gsap.to(toggleChevronGChildren, {
        scale: this.toggled ? 1 : -1,
        overwrite: "auto"
      });
    });
    //Collapsing/Expanding End
  }
}