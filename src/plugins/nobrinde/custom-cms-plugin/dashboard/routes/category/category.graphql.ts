import { graphql } from '@/gql';

export const categoryListDocument = graphql(`
  query CategoryList($options: CategoryListOptions) {
    categories(options: $options) {
      items {
        id
        createdAt
        updatedAt
        name
        description
        type
        active
        channels {
          id
          code
        }
      }
      totalItems
    }
  }
`);

export const categoryDetailFragment = graphql(`
  fragment CategoryDetail on Category {
    id
    createdAt
    updatedAt
    name
    description
    type
    active
    channels {
      id
      code
    }
  }
`);

export const categoryDetailDocument = graphql(
  `
    query CategoryDetail($id: ID!) {
      category(id: $id) {
        ...CategoryDetail
      }
    }
  `,
  [categoryDetailFragment],
);

export const createCategoryDocument = graphql(`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
    }
  }
`);

export const updateCategoryDocument = graphql(`
  mutation UpdateCategory($input: UpdateCategoryInput!) {
    updateCategory(input: $input) {
      id
    }
  }
`);

export const deleteCategoryDocument = graphql(`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id) {
      result
      message
    }
  }
`);

export const deleteCategoriesDocument = graphql(`
  mutation DeleteCategories($ids: [ID!]!) {
    deleteCategories(ids: $ids) {
      result
      message
    }
  }
`);

export const assignCategoriesToChannelDocument = graphql(`
  mutation AssignCategoriesToChannel($input: AssignCategoriesToChannelInput!) {
    assignCategoriesToChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);

export const removeCategoriesFromChannelDocument = graphql(`
  mutation RemoveCategoriesFromChannel($input: RemoveCategoriesFromChannelInput!) {
    removeCategoriesFromChannel(input: $input) {
      id
      channels {
        id
        code
      }
    }
  }
`);
