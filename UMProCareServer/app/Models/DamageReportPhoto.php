<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class DamageReportPhoto extends Model
{
    protected $fillable = [
        'damage_report_id',
        'photo_path',
    ];

    // Include a ready-to-use URL whenever this model is serialized,
    // so the mobile app never has to build storage paths itself.
    protected $appends = ['url'];

    public function damageReport(): BelongsTo
    {
        return $this->belongsTo(DamageReport::class);
    }

    public function getUrlAttribute(): string
    {
        return Storage::disk('public')->url($this->photo_path);
    }
}
