<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
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
            'product_slug' => 'required|string',
            'billing_cycle' => 'required|string|in:monthly,yearly',
            'idempotency_key' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'product_slug.required' => 'Product slug wajib diisi.',
            'billing_cycle.required' => 'Billing cycle wajib dipilih.',
            'billing_cycle.in' => 'Billing cycle harus monthly atau yearly.',
        ];
    }
}
