export const kebabCaseConversion = (product: string) => {
    const prefix = "add-to-cart-";
    const kebabCaseOutput = prefix + product
        .toLowerCase()
        .replace(/ /g, '-');
    return kebabCaseOutput
}