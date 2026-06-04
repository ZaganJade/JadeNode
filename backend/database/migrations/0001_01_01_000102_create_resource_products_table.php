<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('resource_products', function (Blueprint $table) {
            $table->id();
            $table->string('public_id')->unique();
            $table->foreignId('provider_id')->constrained('providers')->cascadeOnDelete();
            $table->foreignId('category_id')->constrained('product_categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('resource_type');
            $table->string('region');
            $table->string('availability_status')->default('available');
            $table->integer('provisioning_sla_hours')->default(24);
            $table->integer('display_priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->json('trust_indicators')->nullable();
            $table->json('specs')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resource_products');
    }
};
