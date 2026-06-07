<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminStoreListingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'provider_id' => ['required', 'integer', 'exists:providers,id'],
            'category_id' => ['required', 'integer', 'exists:product_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:resource_products,slug'],
            'description' => ['nullable', 'string', 'max:2000'],
            'resource_type' => ['required', 'string', 'max:100'],
            'region' => ['required', 'string', 'max:100'],
            'availability_status' => ['required', 'string', 'in:available,limited,waitlist,unavailable'],
            'provisioning_sla_hours' => ['required', 'integer', 'min:1', 'max:720'],
            'display_priority' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'specs' => ['nullable', 'array'],
            'prices' => ['required', 'array', 'min:1'],
            'prices.*.billing_cycle' => ['required', 'string', 'in:monthly,yearly'],
            'prices.*.gross_price_minor' => ['required', 'integer', 'min:0'],
        ];
    }

    /**
     * Custom messages for a friendlier admin experience (Bahasa Indonesia).
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.regex' => 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.',
            'slug.unique' => 'Slug ini sudah digunakan produk lain.',
            'prices.min' => 'Minimal satu harga (bulanan) wajib diisi.',
            'provider_id.exists' => 'Provider yang dipilih tidak valid.',
            'category_id.exists' => 'Kategori yang dipilih tidak valid.',
        ];
    }
}
