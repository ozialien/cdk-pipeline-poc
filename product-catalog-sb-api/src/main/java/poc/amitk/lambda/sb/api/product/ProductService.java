package poc.amitk.lambda.sb.api.product;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;

import java.time.ZonedDateTime;
import java.util.List;

/**
 * @author amitkapps
 * 
 *         https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-java-aop-spring.html
 * 
 *         and
 * 
 *         https://docs.powertools.aws.dev/lambda/java/core/tracing
 * 
 *         are incompatible with each other. Choose one or the other.
 *         It appears powertools did not like being with aop at all.
 * 
 * @author enr
 * 
 */
@Service
public class ProductService {
    private static final String PRODUCT_SKU = "Product-SKU";
    private static final String OPERATION_NAME = "Operation-Name";
    private static final String OPERATION_TYPE = "Operation-Type";

    @Autowired
    private ProductRepository productRepository;

    private Logger logger = LoggerFactory.getLogger(ProductService.class);

    public Product getProductBySku(String productSku) {
        Subsegment subsegment = AWSXRay.getCurrentSubsegment();
        logger.info("Getting product: {}", productSku);
        if (subsegment != null) {
            logger.info("getProductBySku Subsegment {}", subsegment.getName());
            subsegment.putAnnotation(PRODUCT_SKU, productSku);
            subsegment.putAnnotation(OPERATION_NAME, "getProductBySku");
            subsegment.putAnnotation(OPERATION_TYPE, "JavaFunctionInvoke");
        }
        ProductEntity productEntity = productRepository.findByProductSku(productSku);
        return null != productEntity ? ProductPojoConverter.toProduct(productEntity) : null;
    }

    public List<Product> getAllProducts() {
        Subsegment subsegment = AWSXRay.getCurrentSubsegment();
        logger.info("getting all products");
        if (subsegment != null) {

            logger.info("getAllProducts Subsegment {}", subsegment.getName());
            subsegment.putAnnotation(OPERATION_NAME, "getAllProducts");
            subsegment.putAnnotation(OPERATION_TYPE, "JavaFunctionInvoke");
        }
        List<ProductEntity> allProductEntities = productRepository.findAll();
        logger.info("found {} products", allProductEntities.size());

        return allProductEntities.stream()
                .map(ProductPojoConverter::toProduct)
                .toList();
    }

    @Transactional
    public Product addProductToCatalog(Product product) {
        logger.info("Adding product {} to catalog", product.getProductSku());
        product.setAddedToCatalogOn(ZonedDateTime.now());
        ProductEntity productEntity = productRepository.save(ProductPojoConverter.toProductEntity(product));
        return ProductPojoConverter.toProduct(productEntity);
    }

    @Transactional
    public void removeProductFromCatalog(String productSku) {
        logger.info("Removing product {} from catalog", productSku);
        ProductEntity productEntity = new ProductEntity();
        productEntity.setProductSku(productSku);
        productRepository.delete(productEntity);
    }

    @Transactional
    public void removeAllProductsFromCatalog() {
        logger.info("Removing all products from the catalog");
        productRepository.deleteAll();
    }
}
