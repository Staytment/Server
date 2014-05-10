/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name : [process.env.NEW_RELIC_APP_NAME || 'frozen-forest-dev'],
  /**
   * Your New Relic license key.
   */
  license_key : '2f4b1c07940be20d4264641ef1591dfd52e83f59',
  logging : {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level : 'trace'
  }
};
