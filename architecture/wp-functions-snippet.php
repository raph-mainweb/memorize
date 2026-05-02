<?php
/**
 * Nachklang Custom REST API Endpoint
 * 
 * Stellt /wp-json/nachklang/v1/sync-product bereit.
 * Authentifizierung via WordPress Application Password (Basic Auth).
 * Schreibt Produkt-Daten direkt via update_field() in ACF-Felder.
 * 
 * In functions.php einfügen (am Ende, vor dem schliessenden ?>)
 */

add_action('rest_api_init', function () {
    register_rest_route('nachklang/v1', '/sync-product', [
        'methods'             => 'POST',
        'callback'            => 'nachklang_sync_product',
        'permission_callback' => 'nachklang_check_permission',
    ]);
});

/**
 * Prüft ob der Request authentifiziert ist (Application Password / Basic Auth).
 */
function nachklang_check_permission($request) {
    return current_user_can('edit_posts');
}

/**
 * Erstellt oder aktualisiert einen Product-Post und füllt die ACF-Felder ab.
 *
 * Erwartet JSON:
 * {
 *   "slug":   "qr-medaillons-klassisch",
 *   "title":  "QR-Medaillons Klassisch",
 *   "fields": { "price": "57.00", "shopify_product_id": "...", ... }
 * }
 */
function nachklang_sync_product(WP_REST_Request $request) {
    $data   = $request->get_json_params();
    $slug   = isset($data['slug'])  ? sanitize_title($data['slug'])      : '';
    $title  = isset($data['title']) ? sanitize_text_field($data['title']) : '';
    $fields = isset($data['fields']) && is_array($data['fields']) ? $data['fields'] : [];

    if (empty($slug)) {
        return new WP_Error('missing_slug', 'slug is required', ['status' => 400]);
    }

    // Bestehenden Post per Slug suchen
    $existing = get_posts([
        'post_type'      => 'products',
        'name'           => $slug,
        'posts_per_page' => 1,
        'post_status'    => ['publish', 'draft'],
    ]);

    if (!empty($existing)) {
        // UPDATE
        $post_id = $existing[0]->ID;
        wp_update_post([
            'ID'          => $post_id,
            'post_title'  => $title,
            'post_status' => 'publish',
        ]);
        $action = 'updated';
    } else {
        // CREATE
        $post_id = wp_insert_post([
            'post_type'   => 'products',
            'post_title'  => $title,
            'post_name'   => $slug,
            'post_status' => 'publish',
        ]);
        $action = 'created';
    }

    if (is_wp_error($post_id)) {
        return new WP_Error(
            'wp_error',
            $post_id->get_error_message(),
            ['status' => 500]
        );
    }

    // ACF-Felder abfüllen via update_field()
    // (ACF speichert Daten als Post Meta — update_field() ist der korrekte Weg)
    $updated_fields = [];
    foreach ($fields as $field_name => $field_value) {
        // Sanitize: Strings erlaubt, Arrays werden als JSON gespeichert
        $safe_value = is_string($field_value) ? sanitize_textarea_field($field_value) : $field_value;
        update_field($field_name, $safe_value, $post_id);
        $updated_fields[] = $field_name;
    }

    return [
        'success'        => true,
        'action'         => $action,
        'post_id'        => $post_id,
        'slug'           => $slug,
        'updated_fields' => $updated_fields,
    ];
}
