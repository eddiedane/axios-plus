import axios from "axios";

const specialConfigs = ["vars", "routes", "addRouteMethod"];
const methodsType1 = ["get", "delete", "head", "options"];
const methodsType2 = ["post", "put", "patch"];

let globalRoutes = [];

const resolveData$Config = (data$config, allowRegularKeys = false) => {
  const $config = {};
  const $special = {};
  const data = {};

  if (typeof FormData !== "undefined" && data$config instanceof FormData) {
    return { data: data$config, $config: {}, $special: {} };
  }

  for (let key in data$config) {
    let option = data$config[key];
    let isSpecial = key[0] === "$";

    if ((!allowRegularKeys && isSpecial) || allowRegularKeys) {
      const configName = isSpecial ? key.substr(1) : key;
      if (specialConfigs.includes(configName)) $special[configName] = option;
      else $config[configName] = option;
    } else data[key] = option;
  }

  return { $config, $special, data };
};

const resolveUrl = (url, routes) => {
  if (typeof url === "object") return url;
  else if (url[0] === "$") {
    const routeName = url.substr(1);
    const match = routes.find((route) => route.name === routeName);

    if (match) return match;

    throw new Error(`AxiosPlus: route "${url}" does not exist`);
  } else return { path: url };
};

const fillPath = (url, placeholdersData = {}) => {
  const placeholderExpression = /:(\w+)/g;
  return url.replace(placeholderExpression, (match, variableName) => {
    const replacement = placeholdersData[variableName] || match;

    if (replacement === match) {
      console.warn(
        `AxiosPlus: url placeholder "${match}" has no matching replacement value`
      );
    }

    return placeholdersData[variableName] || match;
  });
};

const resolveNamedRouteConfig = (url, args) => {
  let config = {};

  if (args[0] == null || typeof args[0] == "object") {
    config = args[0] || {};
    if (Array.isArray(config.vars || config.$vars)) {
      if ("vars" in config) config.vars = getPathPlaceholders(url, config.vars);
      else config.vars = getPathPlaceholders(url, config.$vars);
    }
  } else {
    config = {
      vars: getPathPlaceholders(url, args),
    };
  }

  return config;
};

const getPathPlaceholders = (url, arr) => {
  const match = url.match(/\:(\w+)/g);

  if (!match || !match.length) return {};

  return match.reduce((obj, placeholder, i) => {
    placeholder = placeholder.replace(":", "");
    const value = arr[i];
    return value === undefined ? obj : { ...obj, [placeholder]: value };
  }, {});
};

export const router = (base = "/", routes = []) => {
  return routes.map((route) => ({ ...route, path: base + route.path }));
};

const create = (config = {}) => {
  const { $config: createConfig, $special: createSpecial } = resolveData$Config(
    config,
    true
  );

  const _axios = axios.create(createConfig);
  const _routes = createSpecial.routes || [];

  const axiosPlus = (config) => {
    const method = (config.method || "get").toLowerCase();
    return axiosPlus[method](config.url, { $data: config.data });
  };

  axiosPlus.router = router;

  const request = (method, url, data$config, config) => {
    const { data, $config, $special } = resolveData$Config(data$config);
    const resolvedConfig = resolveData$Config(config, true);
    const fullConfig = { ...$config, ...resolvedConfig.$config };
    const urlObj = resolveUrl(url, _routes);

    if (typeof urlObj.path != "string") {
      throw new Error("AxiosPlus: invalid url/path");
    }

    const resolvedUrl = fillPath(urlObj.path, {
      ...$special.vars,
      ...resolvedConfig.$special.vars,
      ...(urlObj.fillPathWithData ? data : {}),
    });

    const params = {
      ...fullConfig.params,
      ...urlObj.params,
    };

    return _axios({
      method,
      url: resolvedUrl,
      data,
      params,
      ...fullConfig,
    });
  };

  if (createSpecial.addRouteMethod) {
    _routes.forEach((route) => {
      if (!route.name) return;

      const method = route.method || "get";
      const url = route.name ? "$" + route.name : route.path;

      axiosPlus[route.name] = methodsType1.includes(method)
        ? (...args) => {
            const config = resolveNamedRouteConfig(route.path, args);
            return request(method, url, {}, config);
          }
        : (data$config, config) => {
            return request(method, url, data$config, config);
          };
    });
  }

  methodsType1.forEach((method) => {
    axiosPlus[method] = (url, config) => {
      return request(method, url, {}, config);
    };
  });

  methodsType2.forEach((method) => {
    axiosPlus[method] = (url, data$config, config) => {
      return request(method, url, data$config, config);
    };
  });

  axiosPlus.axios = _axios;
  axiosPlus.onRequest = (interceptor, error) => {
    _axios.interceptors.request.use(interceptor, error);
  };
  axiosPlus.onRequestError = (interceptor) => {
    _axios.interceptors.request.use((config) => config, interceptor);
  };
  axiosPlus.onResponse = (interceptor, error) => {
    _axios.interceptors.response.use(interceptor, error);
  };
  axiosPlus.onResponseError = (interceptor) => {
    _axios.interceptors.response.use(
      (res) => res,
      (error) => {
        interceptor(error);
        return Promise.reject(error);
      }
    );
  };

  return axiosPlus;
};

const axiosPlus = create();
axiosPlus.create = create;
axiosPlus.routes = (routes = []) => {
  globalRoutes = [...globalRoutes, ...routes];
};

export default axiosPlus;