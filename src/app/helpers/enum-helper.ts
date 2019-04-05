export class EnumHelper {
    public static getEnumPropertyName(e: any, value: any) {
        for (const k of Object.keys(e)) {
            if (e[k] === value) {
                return k;
            }
        }
        return null;
    }

    public static getEnumNumberArray(e: any) {
        const enumValues = [];
        for (const property in e) {
            if (e.hasOwnProperty(property) && typeof e[property] === 'number') {
                enumValues.push(e[property]);
            }
        }
        return enumValues;
    }
}
