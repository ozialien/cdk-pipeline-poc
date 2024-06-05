package poc.amitk.lambda.sb.api.infra;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;
import software.amazon.awssdk.services.secretsmanager.model.SecretsManagerException;

import java.util.Map;

/**
 * @author amitkapps
 */
@Service
public class SecretsManagerService {
    private Logger logger = LoggerFactory.getLogger(this.getClass());

    /**
     * Get the value of the secret as string, skd automatically base64 decodes the values
     * if the secrets are setup as name/value pairs, they come back as a json.
     * @param secretId
     * @return
     */
    public String getSecretValue(String secretId){
        logger.info("getting secret: {}", secretId);
        SecretsManagerClient secretsClient = SecretsManagerClient.builder()
                .credentialsProvider(DefaultCredentialsProvider.create()) //Will automatically pick it up from aws.profile system property or AWS_PROFILE environment var
                .build();

        try {
            logger.debug("firing get secret value request");
            GetSecretValueRequest valueRequest = GetSecretValueRequest.builder()
                    .secretId(secretId)
                    .build();

            GetSecretValueResponse valueResponse = secretsClient.getSecretValue(valueRequest);
            String secret = valueResponse.secretString();
            logger.debug("retrieved secret");
            return (secret);

        } catch (SecretsManagerException e) {
            logger.error("could not retrieve secret", e);
            throw e;
        }
        finally {
            secretsClient.close();
        }
    }

    /**
     * Get the value of the secrets name/value pairs as a map
     * if the secrets are not setup as name/value pairs json exception will be thrown
     * @param secretId
     * @return
     * @throws JsonProcessingException
     */
    public Map<String, String> getSecretsAsMap(String secretId) throws JsonProcessingException {
        String json = getSecretValue(secretId);
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(json, Map.class);
    }
}