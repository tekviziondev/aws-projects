/**
  * This function will count the number of occurences of the of string in the Text 
  * @param str 
  * @param find
  * @returns count
  */
export function count(str, find) {
    return (str.split(find)).length - 1;
}
