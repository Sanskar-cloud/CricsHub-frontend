const { withAndroidManifest } = require('@expo/config-plugins');

const withAndroidNetworkSecurity = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;
    const application = androidManifest.application[0];
    application.$['android:usesCleartextTraffic'] = 'true';
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    
    return config;
  });
};

module.exports = withAndroidNetworkSecurity;