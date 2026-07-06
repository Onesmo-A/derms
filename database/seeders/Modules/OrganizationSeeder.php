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
            ['name' => 'Singida', 'code' => 'SNG'],
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
        $singida = Region::where('code', 'SNG')->firstOrFail();

        $districts = [
            ['name' => 'Kinondoni', 'code' => 'KIN', 'region_id' => $dar->id],
            ['name' => 'Arusha Municipal Council', 'code' => 'AR-MC', 'region_id' => $arusha->id],
            ['name' => 'Singida DC', 'code' => 'SNG-DC', 'region_id' => $singida->id],
            ['name' => 'Iramba', 'code' => 'SNG-IR', 'region_id' => $singida->id],
            ['name' => 'Mkalama', 'code' => 'SNG-MK', 'region_id' => $singida->id],
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
        $singidaDc = District::where('code', 'SNG-DC')->firstOrFail();
        $mkalama = District::where('code', 'SNG-MK')->firstOrFail();
        $iramba = District::where('code', 'SNG-IR')->firstOrFail();

        $schools = [
            ['registration_number' => 'S0101', 'name' => 'Kinondoni Secondary School', 'district_id' => $kinondoni->id, 'type' => 'government', 'address' => 'Kinondoni, Dar es Salaam'],
            ['registration_number' => 'S0102', 'name' => 'Oysterbay Secondary School', 'district_id' => $kinondoni->id, 'type' => 'government', 'address' => 'Oysterbay, Dar es Salaam'],
            ['registration_number' => 'P0103', 'name' => 'Hananasif Secondary School', 'district_id' => $kinondoni->id, 'type' => 'private', 'address' => 'Hananasif, Dar es Salaam'],
            ['registration_number' => 'P0104', 'name' => 'Victoria Secondary School', 'district_id' => $kinondoni->id, 'type' => 'private', 'address' => 'Victoria, Dar es Salaam'],
            ['registration_number' => 'S0105', 'name' => 'Mikocheni Secondary School', 'district_id' => $kinondoni->id, 'type' => 'government', 'address' => 'Mikocheni, Dar es Salaam'],
            ['registration_number' => 'P0106', 'name' => 'Arusha Science Secondary School', 'district_id' => $arushaMc->id, 'type' => 'private', 'address' => 'Njiro, Arusha'],
            ['registration_number' => 'S0301', 'name' => 'Mudida Secondary School', 'district_id' => $singidaDc->id, 'type' => 'government', 'address' => 'Singida DC, Singida'],
            ['registration_number' => 'S0302', 'name' => 'Mrama Secondary School', 'district_id' => $singidaDc->id, 'type' => 'government', 'address' => 'Singida DC, Singida'],
            ['registration_number' => 'S0303', 'name' => 'Ntonge Secondary School', 'district_id' => $singidaDc->id, 'type' => 'government', 'address' => 'Singida DC, Singida'],
            ['registration_number' => 'S0304', 'name' => 'Maghojoa Secondary School', 'district_id' => $singidaDc->id, 'type' => 'government', 'address' => 'Singida DC, Singida'],
            ['registration_number' => 'S0401', 'name' => 'Jorma Secondary School', 'district_id' => $mkalama->id, 'type' => 'government', 'address' => 'Mkalama, Singida'],
            ['registration_number' => 'S0402', 'name' => 'Mwanga Secondary School', 'district_id' => $mkalama->id, 'type' => 'government', 'address' => 'Mkalama, Singida'],
            ['registration_number' => 'S0403', 'name' => 'Selenge Secondary School', 'district_id' => $mkalama->id, 'type' => 'government', 'address' => 'Mkalama, Singida'],
            ['registration_number' => 'S0404', 'name' => 'Ibaga Secondary School', 'district_id' => $mkalama->id, 'type' => 'government', 'address' => 'Mkalama, Singida'],
            ['registration_number' => 'S0201', 'name' => 'Iramba Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0202', 'name' => 'Lulumba Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0203', 'name' => 'Kinampanda Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0204', 'name' => 'Kiomboi Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0205', 'name' => 'Kinambeu Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'P0206', 'name' => 'New Kiomboi Secondary School', 'district_id' => $iramba->id, 'type' => 'private', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0207', 'name' => 'Mtoa Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0208', 'name' => 'Kizaga Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0209', 'name' => 'Mbelekese Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0210', 'name' => 'Mgongo Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0211', 'name' => 'Mtekente Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0212', 'name' => 'Kyengege Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0213', 'name' => 'Kidaru Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0214', 'name' => 'Kisana Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0215', 'name' => 'Kisiriri Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0216', 'name' => 'Kaselya Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'S0217', 'name' => 'Maluga Secondary School', 'district_id' => $iramba->id, 'type' => 'government', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'P0218', 'name' => 'Dr. Mwigulu Nchemba Secondary School', 'district_id' => $iramba->id, 'type' => 'private', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'P0219', 'name' => 'Katala High School', 'district_id' => $iramba->id, 'type' => 'private', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'P0220', 'name' => 'Kiomboi Lutheran Junior Seminary', 'district_id' => $iramba->id, 'type' => 'private', 'address' => 'Iramba, Singida'],
            ['registration_number' => 'P0221', 'name' => 'Tumaini Secondary School', 'district_id' => $iramba->id, 'type' => 'private', 'address' => 'Iramba, Singida'],
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
