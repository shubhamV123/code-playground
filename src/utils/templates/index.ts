import { defaultTemplate } from "./defaultTemplate";
import { muiTemplate } from "./muiTemplate";
import { type Template, type TemplateType } from "./types";

export { type Template, type TemplateType };

export const templates: Template[] = [defaultTemplate, muiTemplate];

export function getTemplate(id: TemplateType): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getDefaultTemplate(): Template {
  return defaultTemplate;
}
