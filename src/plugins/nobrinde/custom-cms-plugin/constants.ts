import { CrudPermissionDefinition } from '@vendure/core';

export const CMS_PLUGIN_OPTIONS = Symbol('CMS_PLUGIN_OPTIONS');
export const loggerCtx = 'CmsPlugin';

export const CmsPermissions = new CrudPermissionDefinition('Cms');
export const FaqPermissions = new CrudPermissionDefinition('Faq');
export const DocumentPermissions = new CrudPermissionDefinition('Document');
export const BannerPermissions = new CrudPermissionDefinition('Banner');
export const AlertPermissions = new CrudPermissionDefinition('Alert');
export const FooterPermissions = new CrudPermissionDefinition('Footer');
export const HeaderPermissions = new CrudPermissionDefinition('Header');
export const AuthorPermissions = new CrudPermissionDefinition('Author');
export const CategoryPermissions = new CrudPermissionDefinition('Category');
export const NewsPermissions = new CrudPermissionDefinition('News');
export const PagePermissions = new CrudPermissionDefinition('Page');
