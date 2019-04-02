export class EnumHelper {
    public static getEnumPropertyName(e: any, value: any) {
        for (const k of Object.keys(e)) {
            if (e[k] === value) {
                return k;
            }
        }
        return null;
    }
}
