<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Domains\Identity\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        [$firstName, $middleName, $lastName] = $this->splitName($input['name']);

        return User::create([
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'last_name' => $lastName,
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }

    /**
     * Split a display name into first, middle, and last name components.
     *
     * @return array{0:string,1:?string,2:string}
     */
    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];

        $firstName = array_shift($parts) ?: $name;
        $lastName = array_pop($parts) ?: $firstName;
        $middleName = trim(implode(' ', $parts)) ?: null;

        return [$firstName, $middleName, $lastName];
    }
}
