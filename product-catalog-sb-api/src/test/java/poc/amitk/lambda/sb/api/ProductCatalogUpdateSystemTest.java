package poc.amitk.lambda.sb.api;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.github.javafaker.Faker;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import poc.amitk.lambda.sb.api.product.Product;

import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.TimeZone;
import java.util.concurrent.TimeUnit;

/**
 * @author amitkapps
 */
public class ProductCatalogUpdateSystemTest {

    Logger logger = LoggerFactory.getLogger(ProductCatalogUpdateSystemTest.class);

    @Test
    public void addMultipleProductsToCatalog(){
        for (int i = 0; i < 10; i++) {
            addProductToCatalog();
        }
    }

    String BASE_URL = "https://<api gateway id>.execute-api.us-west-2.amazonaws.com/Prod/products";

    @Test
    public void addProductToCatalog(){
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Product> productResponse = restTemplate.postForEntity(BASE_URL, getProductLaunched(), Product.class);
        logger.info("response status: {}", productResponse.getStatusCode());
        logger.info("response: {}", productResponse.getBody());

    }


    @Test
    public void deleteMultipleProductsFromCatalog(){
        int[] productSkus = new int[]{8888,1111};

        Arrays.stream(productSkus).forEach(productSku -> deleteProductFromCatalog(String.valueOf(productSku)));

    }


    public void deleteProductFromCatalog(String productSku){
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.delete(BASE_URL + "/" + productSku);
    }

    private Product getProductLaunched(){
        Product product = new Product();
        Faker faker = new Faker();
        product.setProductSku(String.valueOf(faker.number().numberBetween(1000,999999)));
        product.setProductName(faker.commerce().productName());
        product.setLaunchDate(ZonedDateTime.ofInstant(faker.date().future(365, TimeUnit.DAYS).toInstant(), TimeZone.getDefault().toZoneId()));

        return product;
    }

    private String toJson(Object object) throws JsonProcessingException {
        ObjectMapper mapper = new ObjectMapper();
        // to be able to handle ZonedDateTime
        mapper.registerModule(new JavaTimeModule());
        return mapper.writeValueAsString(object);
    }

    @Test
    public void deleteAllProductsFromCatalog(){
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.delete(BASE_URL);
    }

    @Test
    public void getAllProductsInCatalog(){
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<Product[]> productsResponse = restTemplate.getForEntity(BASE_URL, Product[].class);
        logger.info("response status: {}", productsResponse.getStatusCode());
        logger.info("count of products in catalog: {}", productsResponse.getBody().length);
        logger.info("response: {}", Arrays.stream(productsResponse.getBody()).toList());

    }

}
