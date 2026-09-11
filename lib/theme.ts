export const THEME_STORAGE_KEY = "cay-theme";

export const THEME_VALUES = ["day", "night"] as const;

export type Theme = (typeof THEME_VALUES)[number];

export const PAPER = {
  day: "#f4f1ea",
  night: "#141210",
} as const;

export function isTheme(value: string | null | undefined): value is Theme {
  return value === "day" || value === "night";
}

export function oppositeTheme(theme: Theme): Theme {
  switch (theme) {
    case "day":
      return "night";
    case "night":
      return "day";
    default: {
      const exhaustive: never = theme;
      return exhaustive;
    }
  }
}

/** Runs in <head> before paint. Only an explicit saved choice overrides the system. */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t!=="day"&&t!=="night")return;document.documentElement.setAttribute("data-theme",t);var color=t==="night"?"${PAPER.night}":"${PAPER.day}";var metas=document.querySelectorAll('meta[name="theme-color"]');metas.forEach(function(meta,index){if(index===0){meta.setAttribute("content",color);meta.removeAttribute("media");}else{meta.remove();}});}catch(e){}})();`;
