# ==========================================
# Stage 1: Build React Frontend Assets
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy dependency files and install
COPY package.json package-lock.json ./
RUN npm ci

# Copy full application code and build assets
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Build Production PHP Environment
# ==========================================
FROM php:8.4-fpm-alpine AS app

# Install system dependencies
RUN alpine_pkgs=" \
        icu-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        postgresql-dev \
        oniguruma-dev \
        git \
        unzip \
        bash \
    " \
    && apk add --no-cache $alpine_pkgs

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        bcmath \
        gd \
        intl \
        mbstring \
        pdo_mysql \
        pdo_pgsql \
        zip \
        opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy PHP application files
COPY composer.json composer.lock ./

# Install production dependencies (ignore platform reqs if needed)
RUN composer install --no-dev --no-interaction --no-scripts --no-autoloader --prefer-dist

# Copy remaining code and frontend build output
COPY . .
COPY --from=frontend-builder /app/public/build ./public/build

# Finish Composer autoload optimization
RUN composer dump-autoload --no-dev --optimize

# Configure Production Opcache and PHP settings
COPY docker/php/php.ini /usr/local/etc/php/conf.d/custom-php.ini

# Set permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Expose port and start PHP-FPM server
EXPOSE 9000
CMD ["php-fpm"]
