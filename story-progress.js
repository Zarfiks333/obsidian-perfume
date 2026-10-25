// Film, rising veil and horizontal gallery share a single scroll clock.
export const FILM_DURATION=6.5;
export const ORBIT_START=9.8;
export const STORY_DURATION=15.6;
const REVEAL_START=5.05,REVEAL_END=6;
const clamp=value=>Math.max(0,Math.min(1,value));
const smooth=value=>{const t=clamp(value);return t*t*(3-2*t);};
export function storyState(time){
 const t=Math.max(0,Math.min(STORY_DURATION,Number(time)||0));
 const horizontal=clamp((t-REVEAL_END)/(ORBIT_START-REVEAL_END));
 return {film:clamp(t/FILM_DURATION),reveal:smooth((t-REVEAL_START)/(REVEAL_END-REVEAL_START)),horizontal,blur:smooth((t-REVEAL_START)/1.45),dark:smooth((horizontal-.02)/.42)*.97,orbit:clamp((t-ORBIT_START)/(STORY_DURATION-ORBIT_START))};
}
export function storyTimeForPanel(index,count){
 if(index===count-1)return STORY_DURATION-.25;
 return REVEAL_END+(ORBIT_START-REVEAL_END)*clamp(index/Math.max(1,count-1));
}
