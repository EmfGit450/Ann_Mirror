import { gsap } from "gsap";

export class BuilderMenu {
  root: HTMLElement;
  showButton: HTMLElement
  collapseButton: HTMLElement;

  constructor(config: { root: string, showButton: string, collapseButton: string }) {
    this.root = document.querySelector(config.root)! as HTMLElement;
    this.showButton = document.querySelector(config.showButton)! as HTMLElement;
    this.collapseButton = document.querySelector(config.collapseButton)! as HTMLElement;

    gsap.set(this.root, { 
      xPercent: -100, 
      opacity: 1 
    });
    
    this.collapseButton.addEventListener("click", this.collapse);
    this.showButton.addEventListener("click", this.show);
  }

  collapse = () => {
    gsap.to(this.root, {
      xPercent: -100,
      duration: 0.4,
      ease: "power4.inOut"
    });
  }
  
  show = () =>  {
    gsap.to(this.root, {
      xPercent: 0,
      duration: 0.4,
      ease: "power4.inOut"
    })
  }
}