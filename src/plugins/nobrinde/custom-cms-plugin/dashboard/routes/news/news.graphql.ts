import { graphql } from '@/gql';

export const newsListDocument = graphql(`
  query NewsList($options: NewsListOptions) {
    newsList(options: $options) {
      items {
        id
        createdAt
        updatedAt
        title
        src
        authorId
        author {
          id
          name
          title
        }
        categoryId
        category {
          id
          name
        }
        channels {
          id
          code
        }
      }
      totalItems
    }
  }
`);

export const newsDetailFragment = graphql(`
  fragment NewsDetail on News {
    id
    createdAt
    updatedAt
    title
    description
    src
    authorId
    author {
      id
      name
      title
    }
    relatedNewsIds
    # relatedNews {
    #   id
    #   title
    # }
    seo {
      title
      image
      description
    }
    categoryId
    category {
      id
      name
      type
    }
    translations {
      id
      languageCode
      title
      description
    }
    channels {
      id
      code
    }
  }
`);

export const newsDetailDocument = graphql(
  `
    query NewsDetail($id: ID!) {
      news(id: $id) {
        ...NewsDetail
      }
    }
  `,
  [newsDetailFragment],
);

export const createNewsDocument = graphql(`
  mutation CreateNews($input: CreateNewsInput!) {
    createNews(input: $input) {
      id
    }
  }
`);

export const updateNewsDocument = graphql(`
  mutation UpdateNews($input: UpdateNewsInput!) {
    updateNews(input: $input) {
      id
    }
  }
`);

export const deleteNewsDocument = graphql(`
  mutation DeleteNews($id: ID!) {
    deleteNews(id: $id) {
      result
      message
    }
  }
`);

export const deleteNewsListDocument = graphql(`
  mutation DeleteNewsList($ids: [ID!]!) {
    deleteNewsList(ids: $ids) {
      result
      message
    }
  }
`);

export const assignNewsToChannelDocument = graphql(`
  mutation AssignNewsToChannel($input: AssignNewsToChannelInput!) {
    assignNewsToChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const removeNewsFromChannelDocument = graphql(`
  mutation RemoveNewsFromChannel($input: RemoveNewsFromChannelInput!) {
    removeNewsFromChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

// Query for author dropdown
export const authorsForSelectDocument = graphql(`
  query AuthorsForSelect($options: AuthorListOptions) {
    authors(options: $options) {
      items {
        id
        name
        title
      }
      totalItems
    }
  }
`);

// Query for category dropdown (filtered by type)
export const categoriesForSelectDocument = graphql(`
  query CategoriesForSelect($options: CategoryListOptions) {
    categories(options: $options) {
      items {
        id
        name
        type
      }
      totalItems
    }
  }
`);

// Query for related news dropdown
export const newsForSelectDocument = graphql(`
  query NewsForSelect($options: NewsListOptions) {
    newsList(options: $options) {
      items {
        id
        title
      }
      totalItems
    }
  }
`);
