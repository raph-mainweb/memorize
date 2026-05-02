<?php
/**
 * Plugin Name: Nachklang Sync API
 * Description: Stellt /wp-json/nachklang/v1/sync-product bereit.
 *              Schreibt Shopify-Produktdaten via ACF update_field() in den
 *              "products" Custom Post Type. Authentifizierung via WP Application Password.
 * Version:     1.0.0
 * Author:      Nachklang CH
 *
 * ============================================================
 * INSTALLATION: Diese Datei nach /wp-content/mu-plugins/ hochladen.
 * Must-Use Plugins sind immer aktiv — kein Aktivieren nötig.
 * Sie überleben Theme-Updates und WordPress-Updates.
 * ============================================================
 */

defined('ABSPATH') || exit;

add_action('rest_api_init', function () {
    register_rest_route('nachklang/v1', '/sync-product', [
        'methods'             => WP_REST_Server::CREATABLE, // POST
        'callback'            => 'nachklang_sync_product',
        'permission_callback' => 'nachklang_check_permission',
        'args'                => [
            'slug'   => ['required' => true,  'type' => 'string'],
            'title'  => ['required' => true,  'type' => 'string'],
            'fields' => ['required' => false, 'type' => 'object'],
        ],
    ]);
});

/**
 * Authentifizierung: WordPress Application Password (Basic Auth).
 * Der API-User braucht mindestens die Rolle "Editor".
 */
function nachklang_check_permission(WP_REST_Request $request): bool {
    return current_user_can('edit_posts');
}

/**
 * Erstellt oder aktualisiert einen Product-Post und füllt ACF-Felder ab.
 *
 * Request JSON:
 * {
 *   "slug":   "qr-medaillons-klassisch",
 *   "title":  "QR-Medaillons Klassisch",
 *   "fields": {
 *     "shopify_product_id": "123456",
 *     "price":              "57.00",
 *     "image_url":          "https://...",
 *     ...
 *   }
 * }
 *
 * Response JSON:
 * { "success": true, "action": "created|updated", "post_id": 42, "slug": "..." }
 */
function nachklang_sync_product(WP_REST_Request $request): WP_REST_Response|WP_Error {
    $slug   = sanitize_title($request->get_param('slug'));
    $title  = sanitize_text_field($request->get_param('title'));
    $fields = $request->get_param('fields');
    $fields = is_array($fields) ? $fields : [];

    if (empty($slug)) {
        return new WP_Error('missing_slug', 'slug darf nicht leer sein.', ['status' => 400]);
    }

    // Bestehenden Post per Slug suchen
    $existing = get_posts([
        'post_type'      => 'products',
        'name'           => $slug,
        'posts_per_page' => 1,
        'post_status'    => ['publish', 'draft'],
        'no_found_rows'  => true,
    ]);

    if (!empty($existing)) {
        // UPDATE
        $post_id = $existing[0]->ID;
        $result  = wp_update_post([
            'ID'          => $post_id,
            'post_title'  => $title,
            'post_status' => 'publish',
        ], true);
        $action = 'updated';
    } else {
        // CREATE
        $result = wp_insert_post([
            'post_type'   => 'products',
            'post_title'  => $title,
            'post_name'   => $slug,
            'post_status' => 'publish',
        ], true);
        $action  = 'created';
        $post_id = $result;
    }

    if (is_wp_error($result)) {
        return new WP_Error(
            'wp_post_error',
            $result->get_error_message(),
            ['status' => 500]
        );
    }

    // ACF-Felder via update_post_meta() abfüllen
    // Zuverlässiger als update_field() weil kein ACF-Feldname-Lookup nötig.
    // ACF liest direkt aus wp_postmeta — Werte erscheinen identisch in den ACF-Feldern.
    $updated_fields = [];
    foreach ($fields as $field_name => $field_value) {
        $clean_name = sanitize_key($field_name);
        // wp_kses_post erlaubt sicheres HTML (Fett, Listen, Absätze etc.)
        $safe_value = is_string($field_value)
            ? wp_kses_post($field_value)
            : $field_value;

        update_post_meta($post_id, $clean_name, $safe_value);
        $updated_fields[] = $clean_name;
    }

    return new WP_REST_Response([
        'success'        => true,
        'action'         => $action,
        'post_id'        => $post_id,
        'slug'           => $slug,
        'updated_fields' => $updated_fields,
        'field_count'    => count($updated_fields),
    ], 200);
}
