/* From Model

format(box: Box<Scalar>, context: FormatContext) {
  const settingVal = context === 'domId' 
    ? 'domId' 
    : this.ctrlr.settingStore.get(formatContextSettings[context]);
  if (settingVal === 'raw') {
    return (box.raw ?? box.value).toString();
  } else if (settingVal === 'domId') {
    return utils.strToId((box.raw ?? box.value).toString());
  } else {
    return box.value.toString();
  }
}

*/