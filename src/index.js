import _ from "lodash";

export class Builder {
  constructor(builder) {
    this.builder = builder;
    this.usingWrappers = [];
    this.injectValues = [];
    this.withProperties = [];
  }

  with(properties) {
    this.withProperties.push(properties);
    return this;
  }

  using(wrapper, preWrapper) {
    this.usingWrappers.push({
      wrapper,
      preWrapper: preWrapper ? preWrapper : null
    });

    return this;
  }

  inject(values, clone = true) {
    this.injectValues.push(clone ? _.cloneDeep(values) : values);
    return this;
  }

  override(key, values) {
    const index = _.findIndex(this.injectValues, o => o.key == key);
    if (index === -1) return this;

    this.injectValues[index] = _.assign(this.injectValues[index], values);
    return this;
  }

  create() {
    let properties = {};
    properties = _.reduce(
      this.withProperties,
      (result, value) =>
        _.assign({}, result, _.isFunction(value) ? value() : value),
      properties
    );

    _.forEach(this.usingWrappers, ({ preWrapper }) => {
      if (preWrapper) {
        preWrapper();
      }
    });

    let builder = this.builder(properties);
    builder = _.reduce(
      this.injectValues,
      (result, value) => result(value),
      builder
    );

    while (_.isFunction(builder)) {
      builder = builder();
    }

    let result = builder;
    result = _.reduce(
      this.usingWrappers,
      (accumelatedResult, { wrapper }) => wrapper(accumelatedResult),
      result
    );

    return result;
  }
}

const constructBuilder = builder => {
  return new Builder(builder);
};

export default constructBuilder;
