import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { pascalCase } from "pascal-case";

const bcryptSaltRounds: number = 10;

/**
 * @param password 
 */
export const hashPassword = (password: string): string => {
  if (!password) {
    throw new Error(`invalid password '${password}'`);
  }
  return bcrypt.hashSync(password, bcryptSaltRounds);
};

/**
 * simple template parser
 * @param stringTemplate ex (cn=${groupName})
 * @param obj pass a object ex { groupName }
 */
export const parseTemplate = (stringTemplate: string, obj: any) => stringTemplate.replace(/\${(.*?)}/g, (x, g) => obj[g]);

/**
 * encode ldapPassword
 * @param utf8
 */
export const encodeAdPassword = (utf8: string): string => {
  const quoteEncoded = '"' + '\u0000';
  let utf16le = quoteEncoded;
  // eslint-disable-next-line no-plusplus
  for (let i = 0, n = utf8.length; i < n; ++i) {
    // utf16le += utf8[i] + '\\000';
    utf16le += utf8[i] + '\u0000';
  }
  utf16le += quoteEncoded;

  return utf16le;
}

/**
 * encode ldapPassword in base64 format / unicodePwd
 * used to encode passwords and use it in iso file staticfiles/usr/share/samba/setup/c3/users.ldif
 * @param utf8
 */
export const encodeAdPasswordBase64 = (adPassword: string): string => {
  // 1234 = `IgAxADIAMwA0ACIA` in iso `unicodePwd:: IgAxADIAMwA0ACIA`
  // can use base64 decode to get original password
  return Buffer.from(encodeAdPassword(adPassword)).toString('base64')
}

/**
 * helper to filter valid groups
 * @param group current group to act on
 * @param ldapSearchGroupPrefix ex `C3` or empty `` for (all)
 * @param ldapSearchGroupExcludeGroups `C3Developer,C3Administrator` or empty `` for (all)
 */
export const includeLdapGroup = (group: string, groupPrefix: string, groupExcludeGroups: string[], debug: boolean = false): boolean => {
  const excluded = groupExcludeGroups.length > 0 && groupExcludeGroups.findIndex(e => e === group) >= 0;
  if (excluded && debug) {
    Logger.log(`includeLdapGroup excluded group :${group}`, 'Util');
  }
  return (group.startsWith(groupPrefix) && !excluded);
}

/**
 * get profile from user dn/defaultGroup, ASSUMES that 2 item is defaultGroup
 * @param dn ex "CN=c3,OU=C3Administrator,OU=People,DC=c3edu,DC=online"
 * @returns extracted profile output "C3Administrator"
 */
export const getProfileFromDistinguishedName = (dn: string): string => {
  try {
    const inputArray = dn.split(',');
    const inputArrayProfile = inputArray[1].split('=');
    const profile = inputArrayProfile[1];
    return profile;
  } catch (err) {
    return '';
  }
}

export const getProfileFromFirstMemberOf = (memberOf: string[]): string => {
  try {
    if (Array.isArray(memberOf) && memberOf.length) {
      return pascalCase(memberOf[0]);
    }
  } catch (err) {
    return 'INVALID PROFILE, user must have at least on group in it\'s memberOf to extract a valid profile';
  }
}
