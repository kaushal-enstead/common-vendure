import { Injector, RequestContext } from '@vendure/core';
import { LoadTemplateInput, TemplateLoader, Partial } from '@vendure/email-plugin';
import { readFileSync, existsSync } from 'fs';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

export class CustomLanguageAwareTemplateLoader implements TemplateLoader {
  constructor(private templatePath: string) {}

  async loadTemplate(
    injector: Injector,
    ctx: RequestContext,
    { type, templateName }: LoadTemplateInput,
  ): Promise<string> {
    // Compose possible template file names in order of preference
    const baseName = templateName.replace(/\.hbs$/, '');
    const languageCode = ctx.languageCode;
    const candidates = [
      path.join(this.templatePath, type, `${baseName}.${languageCode}.hbs`),
      path.join(this.templatePath, type, templateName),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return readFileSync(candidate, 'utf-8');
      }
    }

    throw new Error(`Template not found: tried ${candidates.join(', ')}`);
  }

  async loadPartials(): Promise<Partial[]> {
    const partialsPath = path.join(this.templatePath, 'partials');
    const partialsFiles = await readdir(partialsPath);
    return Promise.all(
      partialsFiles.map(async file => {
        return {
          name: path.basename(file, '.hbs'),
          content: await readFile(path.join(partialsPath, file), 'utf-8'),
        };
      }),
    );
  }
}
