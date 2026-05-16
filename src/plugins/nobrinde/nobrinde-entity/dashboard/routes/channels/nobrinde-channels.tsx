import { DetailPageButton, ListPage, DashboardRouteDefinition } from '@vendure/dashboard';
import { Trans } from '@lingui/react/macro';
import { nobrindeChannelListDocument } from './nobrinde-channels.graphql';

const pageId = 'nobrinde-channel-list';

export const nobrindeChannelsList: DashboardRouteDefinition = {
  navMenuItem: {
    sectionId: 'nobrinde',
    id: 'nobrinde-channels',
    url: '/nobrinde/channels',
    title: 'Channels',
  },
  path: '/nobrinde/channels',
  loader: () => ({
    breadcrumb: 'Channels',
  }),
  component: route => {
    return (
      <ListPage
        pageId={pageId}
        title={<Trans>Nobrinde Channels</Trans>}
        listQuery={nobrindeChannelListDocument}
        route={route}
        customizeColumns={{
          name: {
            cell: ({ row }) => {
              const id = row.original.id;
              const name = row.original.name;
              return <DetailPageButton id={id} label={name} />;
            },
          },
        }}
        onSearchTermChange={searchTerm => {
          return searchTerm
            ? {
                _or: [
                  { name: { contains: searchTerm } },
                  { slug: { contains: searchTerm } },
                  { channel_type: { contains: searchTerm } },
                ],
              }
            : {};
        }}
        defaultSort={[{ id: 'id', desc: false }]}
        transformVariables={variables => ({
          options: {
            ...variables.options,
            filterOperator: 'OR',
          },
        })}
        defaultVisibility={{
          createdAt: false,
          updatedAt: false,
          config_json: false,
        }}
      />
    );
  },
};
