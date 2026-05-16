import { graphql } from '@/gql';

const bookingDetailFields = graphql(`
    fragment DashboardBookingDetailFields on Booking {
        id
        name
        languageCode
        slug
        description
        createdAt
        updatedAt
        enabled
        assets {
            id
            name
            preview
            source
            fileSize
            height
            type
            width
        }
        featuredAsset {
            id
            name
            preview
            source
            fileSize
            height
            type
            width
        }
        collection {
            id
            name
            slug
        }
        availableHours {
            to
            from
        }
        form {
            id
            name
            description
            fields {
                label
                id
                name
                options {
                    key
                    value
                }
                type
                description
            }
        }
        availableDays {
            monday
            tuesday
            wednesday
            thursday
            friday
            saturday
            sunday
        }
        facetValues {
            id
            code
            name
            facet {
                id
                name
                code
            }
        }
        seo {
            title
            description
            keywords
        }
    }
`);

export const getBookingsDocument = graphql(
    `
    query DashboardBookings($options: BookingListOptions!) {
        bookings(options: $options) {
            totalItems
            items {
                id
                name
                slug
                enabled
                createdAt
                updatedAt
                featuredAsset {
                    id
                    preview
                }
                collection {
                    id
                    name
                }
            }
        }
    }
`,
);

export const getBookingDocument = graphql(
    `
    query DashboardBooking($id: ID!) {
        booking(id: $id) {
            ...DashboardBookingDetailFields
        }
    }
`,
    [bookingDetailFields],
);

export const createBookingDocument = graphql(
    `
    mutation DashboardCreateBooking($input: CreateBookingInput!) {
        createBooking(input: $input) {
            ...DashboardBookingDetailFields
        }
    }
`,
    [bookingDetailFields],
);

export const updateBookingDocument = graphql(
    `
    mutation DashboardUpdateBooking($input: UpdateBookingInput!) {
        updateBooking(input: $input) {
            ...DashboardBookingDetailFields
        }
    }
`,
    [bookingDetailFields],
);

export const deleteBookingDocument = graphql(`
    mutation DashboardDeleteBooking($id: ID!) {
        deleteBooking(id: $id) {
            result
            message
        }
    }
`);

export const deleteBookingsDocument = graphql(`
    mutation DashboardDeleteBookings($ids: [ID!]!) {
        deleteBookings(ids: $ids) {
            result
            message
        }
    }
`);

export const getFormsForBookingDocument = graphql(`
    query DashboardBookingForms {
        forms(options: { take: 500 }) {
            totalItems
            items {
                id
                name
                description
                fields {
                    id
                    label
                    description
                    name
                    type
                    options {
                        key
                        value
                    }
                }
            }
        }
    }
`);

export const getCollectionsForBookingDocument = graphql(`
    query DashboardBookingCollections {
        collections(options: { take: 500 }) {
            totalItems
            items {
                id
                name
                slug
            }
        }
    }
`);

export const getActiveAdministratorForSlugDocument = graphql(`
    query DashboardActiveAdministratorForSlug {
        activeAdministrator {
            id
            user {
                identifier
            }
        }
    }
`);

const bookingOrderDetailFields = graphql(`
    fragment DashboardBookingOrderDetailFields on BookingOrder {
        id
        status
        updatedAt
        createdAt
        comments {
            type
            message
            createdAt
        }
        formValues {
            fieldId
            value
        }
        booking {
            id
            name
            assets {
                id
                name
                preview
                source
                fileSize
                height
                type
                width
            }
            featuredAsset {
                id
                name
                preview
                source
                fileSize
            }
            form {
                id
                name
                description
                fields {
                    label
                    id
                    name
                    options {
                        key
                        value
                    }
                    type
                    description
                }
            }
        }
        customer {
            id
            firstName
            lastName
            emailAddress
            phoneNumber
            title
        }
    }
`);

export const getBookingOrdersDocument = graphql(
    `
    query DashboardBookingOrders($options: BookingOrderListOptions!) {
        bookingOrders(options: $options) {
            totalItems
            items {
                id
                status
                createdAt
                updatedAt
                booking {
                    id
                    name
                    featuredAsset {
                        id
                        preview
                    }
                }
                customer {
                    id
                    title
                    firstName
                    lastName
                }
            }
        }
    }
`,
);

export const getBookingOrderDocument = graphql(
    `
    query DashboardBookingOrder($id: ID!) {
        bookingOrder(id: $id) {
            ...DashboardBookingOrderDetailFields
        }
    }
`,
    [bookingOrderDetailFields],
);

export const addOrderCommentDocument = graphql(
    `
    mutation DashboardAddOrderComment($input: AddOrderCommentInput!) {
        addOrderComment(input: $input) {
            ...DashboardBookingOrderDetailFields
        }
    }
`,
    [bookingOrderDetailFields],
);
