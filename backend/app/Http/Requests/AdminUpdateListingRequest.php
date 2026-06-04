<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminUpdateListingRequest extends FormRequest
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
            'availability_status' => ['nullable', 'string', 'in:available,limited,waitlist,unavailable'],
            'provisioning_sla_hours' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
            'prices' => ['nullable', 'array'],
            'prices.*.billing_cycle' => ['required_with:prices', 'string', 'in:monthly,yearly'],
            'prices.*.gross_price_minor' => ['required_with:prices', 'integer', 'min:0'],
        ];
    }
}
