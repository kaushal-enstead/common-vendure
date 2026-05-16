# Custom Seller Plugin

## Overview

The Custom Seller Plugin is a comprehensive Vendure plugin that extends the core seller functionality. It handles seller registration, approval workflows, authentication, and provides enhanced seller management capabilities.

## Why This Plugin Exists

### Problem Statement

- Vendure's core seller functionality is basic and lacks approval workflows
- No built-in seller authentication system
- Limited seller management capabilities
- Missing integration with marketplace features like reviews, wishlists, and analytics
- No seller-specific role management and permissions

### Solution

This plugin provides:

- **Complete Seller Lifecycle Management**: Registration, approval, rejection workflows
- [Not used as of now] **Custom Authentication**: Seller-specific login system with approval status checks
- **Enhanced Seller Profiles**: Extended seller information with ratings, reviews, and statistics
- **Marketplace Integration**: Seamless integration with reviews, wishlists, and other marketplace features
- **Role-Based Access Control**: Automatic role assignment and permission management
- [Not used as of now] **UI Extensions**: Custom admin interface for seller management

## Architecture

### Data Flow

1. **Seller Registration**: Sellers register through the marketplace
2. **Approval Process**: Admins review and approve/reject sellers
3. **Role Assignment**: Approved sellers get automatic role assignment
4. **Authentication**: Sellers can login using custom authentication
5. **Marketplace Integration**: Sellers appear in listings with ratings and reviews

## Key Features

### Seller Management

- **Complete CRUD Operations**: Full seller lifecycle management
- **Approval Workflow**: Structured approval/rejection process with reasons
- **Status Tracking**: Track seller approval status and account state
- **Bulk Operations**: Efficient handling of multiple sellers

### Authentication System

- **Custom Login**: Seller-specific authentication endpoint
- **Approval Checks**: Only approved sellers can authenticate
- **Session Management**: Proper session handling for seller accounts
- **Security**: Password validation and credential verification

### Marketplace Integration

- **Review System**: Integration with seller reviews and ratings
- **Wishlist Support**: Sellers can be added to user wishlists
- **Statistics**: Product and service count tracking
- **EasyPay Integration**: Payment processing account management

### Enhanced Seller Profiles

- **Extended Information**: Company details, contact information, location data
- **Policies**: Shop description, privacy policy, shipping policy, return policy
- **Geographic Data**: Latitude/longitude for location-based features
- **Business Information**: VAT numbers, company branding, loyalty program participation

## Integration Points

### Plugin Dependencies

- **WishlistPlugin**: Seller wishlist functionality
- **ReviewPlugin**: Seller reviews and ratings
- **PlatformPlugin**: Platform configuration
- **CustomFacetPlugin**: Enhanced filtering capabilities
- **EasyPayPaymentHandler**: Payment processing integration

### Event System

- **SellerRejectionEvent**: Triggered when sellers are rejected
- **ProductChannelAssociationListener**: Manages product-channel relationships

## Security & Access Control

### Guards & Middleware

- **SellerApprovalGuard**: Ensures only approved sellers can access protected routes
- **SellerApprovalMiddleware**: Middleware for approval status validation
- **Role-Based Access**: Automatic role assignment for approved sellers

### Authentication Strategy

- **Custom Input Type**: Seller-specific authentication input
- **Credential Validation**: Email and password verification
- **Approval Status Check**: Ensures only approved sellers can authenticate

## Usage

### Installation

1. Import the plugin in your Vendure config
2. Configure any required options
3. The plugin automatically integrates with other marketplace plugins

### Seller Registration Flow

1. Seller submits registration with company information
2. Admin reviews seller application
3. Admin approves or rejects with reason
4. Approved sellers get automatic role assignment
5. Sellers can login and access marketplace features

## Configuration

### Custom Fields Mapping

The plugin maps seller custom fields to administrator fields:

- Company information (name, brand, address)
- Contact details (email, phone, mobile)
- Business data (VAT number, contact person)
- Location data (latitude, longitude)
- Policy settings (loyalty program, terms acceptance)

## Maintenance

### Adding New Features

1. Extend the service with new functionality
2. Add corresponding API extensions
