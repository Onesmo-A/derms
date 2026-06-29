<?php

namespace Database\Seeders\Modules;

use App\Domains\School\Models\District;
use App\Domains\School\Models\Region;
use App\Domains\School\Models\School;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrganizationSeeder extends Seeder
{
    public function run(): void
    {
        $regions = [
            ['name' => 'Dar es Salaam', 'code' => 'DSM'],
            ['name' => 'Arusha', 'code' => 'AR'],
        ];

        foreach ($regions as $regionData) {
            Region::firstOrCreate(
                ['code' => $regionData['code']],
                [
                    'id' => (string) Str::uuid(),
                    'name' => $regionData['name'],
                ]
            );
        }

        $dar = Region::where('code', 'DSM')->firstOrFail();
        $arusha = Region::where('code', 'AR')->firstOrFail();

        $districts = [
            ['name' => 'Kinondoni', 'code' => 'KIN', 'region_id' => $dar->id],
            ['name' => 'Arusha Municipal Council', 'code' => 'AR-MC', 'region_id' => $arusha->id],
        ];

        foreach ($districts as $districtData) {
            District::firstOrCreate(
                ['code' => $districtData['code']],
                [
                    'id' => (string) Str::uuid(),
                    'name' => $districtData['name'],
                    'region_id' => $districtData['region_id'],
                ]
            );
        }

        $kinondoni = District::where('code', 'KIN')->firstOrFail();
        $arushaMc = District::where('code', 'AR-MC')->firstOrFail();

        $schools = [
            ['registration_number' => 'S0101', 'name' => 'Kinondoni Secondary School', 'district_id' => $kinondoni->id, 'type' => 'government', 'address' => 'Kinondoni, Dar es Salaam'],
            ['registration_number' => 'S0102', 'name' => 'Oysterbay Secondary School', 'district_id' => $kinondoni->id, 'type' => 'government', 'address' => 'Oysterbay, Dar es Salaam'],
            ['registration_number' => 'S0103', 'name' => 'Hananasif Secondary School', 'district_id' => $kinondoni->id, 'type' => 'private', 'address' => 'Hananasif, Dar es Salaam'],
            ['registration_number' => 'S0104', 'name' => 'Victoria Secondary School', 'district_id' => $kinondoni->id, 'type' => 'private', 'address' => 'Victoria, Dar es Salaam'],
            ['registration_number' => 'S0105', 'name' => 'Mikocheni Secondary School', 'district_id' => $kinondoni->id, 'type' => 'government', 'address' => 'Mikocheni, Dar es Salaam'],
            ['registration_number' => 'S0106', 'name' => 'Arusha Science Secondary School', 'district_id' => $arushaMc->id, 'type' => 'private', 'address' => 'Njiro, Arusha'],
        ];

        foreach ($schools as $schoolData) {
            School::firstOrCreate(
                ['registration_number' => $schoolData['registration_number']],
                [
                    'id' => (string) Str::uuid(),
                    'district_id' => $schoolData['district_id'],
                    'name' => $schoolData['name'],
                    'type' => $schoolData['type'],
                    'level' => 'secondary',
                    'phone_number' => '+255712345678',
                    'email' => strtolower(str_replace(' ', '', $schoolData['name'])) . '@school.sc.tz',
                    'address' => $schoolData['address'],
                ]
            );
        }
    }
}
