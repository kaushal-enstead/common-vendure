import { PluginCommonModule, Type, VendurePlugin } from '@vendure/core';
import * as path from 'path';

import { WishlistPluginModule } from '../wishlist-plugin/wishlist.plugin';
import { adminApiExtensions } from './api/api-extensions';
import { BookingAdminResolver } from './api/booking-admin.resolver';
import { BookingOrderAdminResolver } from './api/booking-order-admin.resolver';
import { BookingShopResolver } from './api/booking-shop.resolver';
import { FormAdminResolver } from './api/form-admin.resolver';
import { FormFieldAdminResolver } from './api/form-field-admin.resolver';
import { BOOKING_PLUGIN_OPTIONS, bookingPermissions } from './constants';
import { BookingAsset } from './entities/booking-asset.entity';
import { BookingOrder } from './entities/booking-order.entity';
import { BookingTranslation } from './entities/booking-translation.entity';
import { Booking } from './entities/booking.entity';
import { FormFieldTranslation, FormTranslation } from './entities/form-field-translation.entity';
import { Form, FormField } from './entities/form-fields.entity';
import { BookingOrderService } from './services/booking-order.service';
import { BookingService } from './services/booking.service';
import { FormFieldService } from './services/form-field.service';
import { FormService } from './services/form.service';
import { PluginInitOptions } from './types';
import { ReviewPluginModule } from '../review-plugin/review.plugin';
import { BookingEntityResolver } from './api/booking-entity.resolver';
@VendurePlugin({
  dashboard: './dashboard/index.tsx',
  imports: [PluginCommonModule, WishlistPluginModule, ReviewPluginModule],
  providers: [
    {
      provide: BOOKING_PLUGIN_OPTIONS,
      useFactory: () => BookingPlugin.options,
    },
    FormFieldService,
    FormService,
    BookingService,
    BookingOrderService,
    BookingService,
    FormFieldService,
    FormService,
  ],
  configuration: config => {
    // Plugin-specific configuration
    // such as custom fields, custom permissions,
    // strategies etc. can be configured here by
    // modifying the `config` object.
    config.authOptions.customPermissions.push(bookingPermissions);
    return config;
  },
  compatibility: '^3.0.0',
  entities: [
    FormField,
    Form,
    FormFieldTranslation,
    FormTranslation,
    Booking,
    BookingOrder,
    BookingTranslation,
    BookingAsset,
  ],
  shopApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [BookingShopResolver, BookingOrderAdminResolver, BookingEntityResolver],
  },
  adminApiExtensions: {
    schema: adminApiExtensions,
    resolvers: [FormFieldAdminResolver, FormAdminResolver, BookingAdminResolver, BookingOrderAdminResolver],
  },
})
export class BookingPlugin {
  static options: PluginInitOptions;

  static init(options: PluginInitOptions): Type<BookingPlugin> {
    this.options = options;
    return BookingPlugin;
  }
}
