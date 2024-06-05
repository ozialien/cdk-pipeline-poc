package poc.amitk.lambda.sb.api.infra;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.util.Map;
import java.util.Properties;

/**
 * @author amitkapps
 */
@Configuration
public class DataAccessConfig {

    private Logger logger = LoggerFactory.getLogger(DataAccessConfig.class);

    @Autowired
    private SecretsManagerService secretsManagerService;

    @Value("${datasource_secret_id}")
    String datasourceSecretId;

    @Value("${datasource.db-schema-name}")
    String databaseSchemaName;

    /**
     * Hikari datasource configs ref: <a href="https://github.com/brettwooldridge/HikariCP">...</a>
     * @return
     * @throws JsonProcessingException
     */
    @Bean
    @Qualifier("productsDS")
    public DataSource productsDS() throws JsonProcessingException {

        HikariConfig config = new HikariConfig();
        Properties props = new Properties();
        //Add other connection pooling properties - min/max/timeouts/min idle
        config.setPoolName("ProductsConnectionPool");
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        Map<String, String> credentialsMap = productsDSCredentials(datasourceSecretId);
        config.setJdbcUrl(getJdbcUrlFromDatsourceSecret(credentialsMap));
        config.setUsername(credentialsMap.get("username"));
        config.setPassword(credentialsMap.get("password"));
        config.setMaximumPoolSize(2);
//        props.setProperty("connectionTestQuery", "select 1 from dual"); // only for non-jdbc4-compliant drivers
        props.put("dataSource.logWriter", new PrintWriter(System.out));

        return new HikariDataSource(config);
    }

    private String getJdbcUrlFromDatsourceSecret(Map<String, String> credentialsMap){
        String jdbcUrl = "jdbc:mysql://"
                + credentialsMap.get("host")
                + ":"
                + String.valueOf(credentialsMap.get("port"))
                + "/" + databaseSchemaName;
        logger.info("JdbcUrl: {}", jdbcUrl);
        return jdbcUrl;
    }

    @Bean
    @Qualifier("productsJdbcTemplate")
    public JdbcTemplate customerJdbcTemplate(@Qualifier("productsDS") DataSource dataSource){
        return new JdbcTemplate(dataSource);
    }

    public Map<String, String> productsDSCredentials(String secretId) throws JsonProcessingException {
        return secretsManagerService.getSecretsAsMap(secretId);
    }

}