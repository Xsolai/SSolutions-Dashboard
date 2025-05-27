export const safeCustomElementDefine = (name, constructor) => {
  if (!customElements.get(name)) {
    try {
      customElements.define(name, constructor);
    } catch (error) {
      // console.warn(`Failed to define custom element ${name}:`, error);
    }
  }
}; 