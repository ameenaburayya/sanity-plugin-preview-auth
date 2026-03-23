import { definePlugin } from 'sanity';
import { EyeOpenIcon } from '@sanity/icons';
import { PreviewAuthPage } from './components/PreviewAuthPage';
import { previewAuthSecret } from './schema/previewAuthSecret';

/** @public */
export type PreviewAuthPluginOptions = {
  /** The origin of your preview site, e.g. https://preview.mysite.com */
  previewOrigin: string;
  /** The path to your draft-mode enable API, e.g. /api/draft-mode/enable */
  previewAuthApi: string;
};

const TOOL_NAME = 'preview-auth';

/**
 * Sanity Studio plugin for long-lived cross-origin preview authentication.
 *
 * Registers:
 * - A hidden `preview-auth` tool reachable via `/preview-auth?redirect=…`
 * - The `sanity.previewAuthSecret` schema type for long-lived secrets
 * @public
 */
export const previewAuthPlugin = definePlugin<PreviewAuthPluginOptions>((options) => ({
  name: TOOL_NAME,
  schema: {
    types: [previewAuthSecret]
  },
  tools: [
    {
      name: TOOL_NAME,
      title: 'Preview Auth',
      icon: EyeOpenIcon,
      component: () => PreviewAuthPage(options)
    }
  ],
  studio: {
    components: {
      toolMenu: (props) => {
        const filteredTools = props.tools.filter((tool) => tool.name !== TOOL_NAME);

        return props.renderDefault({ ...props, tools: filteredTools });
      }
    }
  }
}));
