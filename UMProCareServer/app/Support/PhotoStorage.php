<?php

namespace App\Support;

use App\Models\DamageReport;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Saves the photos that come with a damage report.
 *
 * The mobile app sends each photo as a base64 string (JPEG), which works the
 * same on Android and iOS. Normal multipart file uploads are still accepted.
 *
 * Every photo is checked by READING ITS BYTES (getimagesizefromstring) - not
 * by trusting a file extension or MIME header - which is what used to make
 * Android uploads fail with "photo.0 must be an image".
 */
class PhotoStorage
{
    public const MAX_PHOTOS = 5;
    public const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per photo

    private const EXTENSIONS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    public static function storeFromRequest(Request $request, DamageReport $report): int
    {
        $items = [];

        // 1) base64 strings (what the app sends)
        foreach ((array) $request->input('photos', []) as $value) {
            if (is_string($value) && trim($value) !== '') {
                $items[] = $value;
            }
        }

        // 2) real file uploads (multipart) - still supported
        $files = $request->allFiles()['photos'] ?? [];
        foreach ((array) $files as $file) {
            if ($file instanceof UploadedFile && $file->isValid()) {
                $items[] = $file;
            }
        }

        if (count($items) > self::MAX_PHOTOS) {
            throw ValidationException::withMessages([
                'photos' => ['You can attach up to ' . self::MAX_PHOTOS . ' photos.'],
            ]);
        }

        $saved = 0;

        foreach ($items as $index => $item) {
            $bytes = $item instanceof UploadedFile
                ? (string) file_get_contents($item->getRealPath())
                : static::decodeBase64($item);

            [$mime, $extension] = static::inspect($bytes, $index);

            $path = 'damage-reports/' . now()->format('Ymd') . '-' . Str::uuid() . '.' . $extension;

            Storage::disk('public')->put($path, $bytes);

            $report->photos()->create(['photo_path' => $path]);

            $saved++;
        }

        return $saved;
    }

    private static function decodeBase64(string $value): string
    {
        // Accept both "data:image/jpeg;base64,AAAA..." and plain "AAAA..."
        if (str_contains($value, ',')) {
            $value = substr($value, strpos($value, ',') + 1);
        }

        $bytes = base64_decode(preg_replace('/\s+/', '', $value), true);

        return $bytes === false ? '' : $bytes;
    }

    /**
     * @return array{0: string, 1: string}  [mime, extension]
     */
    private static function inspect(string $bytes, int $index): array
    {
        $label = 'Photo ' . ($index + 1);

        if ($bytes === '') {
            throw ValidationException::withMessages([
                'photos' => ["{$label} could not be read. Please pick it again."],
            ]);
        }

        if (strlen($bytes) > self::MAX_BYTES) {
            throw ValidationException::withMessages([
                'photos' => ["{$label} is larger than 8 MB."],
            ]);
        }

        $info = @getimagesizefromstring($bytes);
        $mime = is_array($info) ? ($info['mime'] ?? '') : '';

        if (! isset(self::EXTENSIONS[$mime])) {
            throw ValidationException::withMessages([
                'photos' => ["{$label} is not a supported image. Please use a JPG, PNG, WEBP or GIF photo."],
            ]);
        }

        return [$mime, self::EXTENSIONS[$mime]];
    }
}
