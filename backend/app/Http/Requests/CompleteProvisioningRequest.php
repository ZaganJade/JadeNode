<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompleteProvisioningRequest extends FormRequest
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
            'hostname' => 'required|string|max:255',
            'ip_address' => 'required|string|max:45',
            'credential' => 'nullable|string|max:4096',
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
            'hostname.required' => 'Hostname wajib diisi.',
            'ip_address.required' => 'IP address wajib diisi.',
            'ip_address.max' => 'Format IP address tidak valid.',
        ];
    }
}
