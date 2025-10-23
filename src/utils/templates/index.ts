import { defaultTemplate } from "./defaultTemplate";
import { muiTemplate } from "./muiTemplate";
import { vanillaTemplate } from "./vanillaTemplate";
import { vueTemplate } from "./vueTemplate";
import { svelteTemplate } from "./svelteTemplate";
import { type Template, type TemplateType } from "./types";

export { type Template, type TemplateType };

export const templates: Template[] = [
  vanillaTemplate,
  defaultTemplate,
  muiTemplate,
  vueTemplate,
  svelteTemplate,
];

export function getTemplate(id: TemplateType): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getDefaultTemplate(): Template {
  return defaultTemplate;
}
