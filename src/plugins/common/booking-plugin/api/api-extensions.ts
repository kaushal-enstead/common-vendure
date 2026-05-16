import gql from 'graphql-tag';

const formFieldAdminApiExtensions = gql`
    type OptionsType {
        key: String!
        value: String!
    }

    type FormFieldTranslation {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        languageCode: LanguageCode!
        label: String!
        description: String!
        options: SepType!
    }

    type FormField implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        name: String!
        label: String!
        type: String!
        description: String!
        options: [OptionsType!]
        translations: [FormFieldTranslation!]!
    }

    type FormFieldList implements PaginatedList {
        items: [FormField!]!
        totalItems: Int!
    }

    # Generated at run-time by Vendure
    input FormFieldListOptions

    extend type Query {
        formField(id: ID!): FormField
        formFields(options: FormFieldListOptions): FormFieldList!
    }

    input OptionsTypeInput {
        key: String!
        value: String!
    }

    input FormFieldTranslationInput {
        id: ID!
        languageCode: LanguageCode!
        label: String
        description: String
        options: [OptionsTypeInput!]
    }

    input CreateFormFieldInput {
        name: String
        type: String!
        translations: [FormFieldTranslationInput!]!
    }

    input UpdateFormFieldInput {
        id: ID!
        name: String
        type: String
        translations: [FormFieldTranslationInput!]!
    }

    extend type Mutation {
        createFormField(input: CreateFormFieldInput!): FormField!
        updateFormField(input: UpdateFormFieldInput!): FormField!
        deleteFormField(id: ID!): DeletionResponse!
    }
`;
const formAdminApiExtensions = gql`
    type FormTranslation {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        languageCode: LanguageCode!
        name: String!
        description: String!
    }

    type Form implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        name: String!
        description: String!
        fields: [FormField]
        deletedAt: DateTime
        translations: [FormTranslation!]!
    }

    type FormList implements PaginatedList {
        items: [Form!]!
        totalItems: Int!
    }

    # Generated at run-time by Vendure
    input FormListOptions

    extend type Query {
        form(id: ID!): Form
        forms(options: FormListOptions): FormList!
    }

    input FormTranslationInput {
        id: ID!
        languageCode: LanguageCode!
        name: String
        description: String
    }

    input CreateFormInput {
        fieldIds: [String!]!
        translations: [FormTranslationInput!]!
    }

    input UpdateFormInput {
        id: ID!
        fieldIds: [String!]
        translations: [FormTranslationInput!]!
    }

    extend type Mutation {
        createForm(input: CreateFormInput!): Form!
        updateForm(input: UpdateFormInput!): Form!
        deleteForm(id: ID!): DeletionResponse!
    }
`;
const bookingAdminApiExtensions = gql`
    type AvailableDaysType {
        monday: Boolean!
        tuesday: Boolean!
        wednesday: Boolean!
        thursday: Boolean!
        friday: Boolean!
        saturday: Boolean!
        sunday: Boolean!
    }

    type SepType {
        description: String!
        title: String!
        keywords: String!
    }

    type SlotType {
        from: String!
        to: String!
    }

    type BookingTranslation {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        languageCode: LanguageCode!
        name: String!
        slug: String!
        description: String!
        seo: SepType!
    }

    type Booking implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        name: String!
        slug: String!
        description: String!
        languageCode: LanguageCode!
        enabled: Boolean!
        form: Form!
        assets: [Asset!]!
        featuredAsset: Asset
        collection: Collection!
        availableHours: [SlotType!]!
        availableDays: AvailableDaysType!
        deletedAt: DateTime
        channels: [Channel!]!
        facetValues: [FacetValue!]!
        seo: SepType!
        translations: [BookingTranslation!]!
        isFavorite: Boolean!
        averageRating: Float
        reviewCount: Int
        seller: Seller
    }

    type BookingList implements PaginatedList {
        items: [Booking!]!
        totalItems: Int!
    }

    input AvailableDaysInput {
        monday: Boolean
        tuesday: Boolean
        wednesday: Boolean
        thursday: Boolean
        friday: Boolean
        saturday: Boolean
        sunday: Boolean
    }

    input SlotInput {
        from: String
        to: String
    }

    input SeoInput {
        title: String
        description: String
        keywords: String
    }

    input BookingTranslationInput {
        id: ID
        languageCode: LanguageCode!
        name: String
        slug: String
        description: String
        seo: SeoInput
    }

    # Generated at run-time by Vendure
    input BookingListOptions

    extend type Query {
        booking(id: ID!): Booking
        bookings(options: BookingListOptions): BookingList!
    }

    input CreateBookingInput {
        enabled: Boolean!
        featuredAssetId: ID
        assetIds: [ID!]
        formId: ID!
        collectionId: ID!
        facetValueIds: [ID!]
        availableHours: [SlotInput!]!
        availableDays: AvailableDaysInput!
        deletedAt: DateTime
        translations: [BookingTranslationInput!]!
    }

    input UpdateBookingInput {
        id: ID!
        enabled: Boolean
        featuredAssetId: ID
        assetIds: [ID!]
        formId: ID
        collectionId: ID
        facetValueIds: [ID!]
        availableHours: [SlotInput!]
        availableDays: AvailableDaysInput
        deletedAt: DateTime
        translations: [BookingTranslationInput!]
    }

    extend type Mutation {
        createBooking(input: CreateBookingInput!): Booking!
        updateBooking(input: UpdateBookingInput!): Booking!
        deleteBooking(id: ID!): DeletionResponse!
        deleteBookings(ids: [ID!]!): [DeletionResponse!]!
    }
`;

const bookingShopApiExtensions = gql`
    extend type Query {
        services(sellerId: ID, options: BookingListOptions, facetValueIds: [ID!]): BookingList!
        service(id: ID!): Booking
        # searchServices(options: BookingListOptions): BookingList!
    }
`;
const bookingOrderAdminApiExtensions = gql`
    type BookingOrderComment {
        type: String
        message: String
        createdAt: DateTime
    }

    type FormValues {
        fieldId: String!
        value: String!
    }

    input BookingOrderCommentInput {
        type: String
        message: String
        createdAt: DateTime
    }

    type BookingOrder implements Node {
        id: ID!
        createdAt: DateTime!
        updatedAt: DateTime!
        deletedAt: DateTime
        booking: Booking!
        status: String!
        customer: Customer!
        customerId: ID!
        bookingId: ID!
        formValues: [FormValues!]!
        comments: [BookingOrderComment]!
    }

    type BookingOrderList implements PaginatedList {
        items: [BookingOrder!]!
        totalItems: Int!
    }

    # Generated at run-time by Vendure
    input BookingOrderListOptions

    extend type Query {
        bookingOrder(id: ID!): BookingOrder
        bookingOrders(options: BookingOrderListOptions): BookingOrderList!
    }

    input FormValuesInput {
        fieldId: String!
        value: String!
    }

    input CreateBookingOrderInput {
        deletedAt: DateTime
        bookingId: ID!
        formValues: [FormValuesInput!]!
    }

    input UpdateBookingOrderInput {
        id: ID!
        status: String
        deletedAt: DateTime
        formValues: [FormValuesInput!]!
    }

    input AddOrderCommentInput {
        id: ID!
        status: String
        deletedAt: DateTime
        comment: BookingOrderCommentInput
    }

    extend type Mutation {
        createBookingOrder(input: CreateBookingOrderInput!): BookingOrder!
        updateBookingOrder(input: UpdateBookingOrderInput!): BookingOrder!
        addOrderComment(input: AddOrderCommentInput!): BookingOrder!
        deleteBookingOrder(id: ID!): DeletionResponse!
    }
`;
const queryAdminApiExtensions = gql`
    extend type Mutation {
        queryRunner(query: String!): String!
    }
`;

export const adminApiExtensions = gql`
    ${formFieldAdminApiExtensions}
    ${formAdminApiExtensions}
    ${bookingAdminApiExtensions}
    ${bookingShopApiExtensions}
    ${bookingOrderAdminApiExtensions}
    ${queryAdminApiExtensions}
`;
