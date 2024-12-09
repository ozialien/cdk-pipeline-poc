package poc.amitk.lambda.sb.api.product;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;
//import software.amazon.lambda.powertools.tracing.Tracing;
//import software.amazon.lambda.powertools.tracing.TracingUtils;
import java.time.ZonedDateTime;
import java.util.List;

/**
 * @author amitkapps
 */

//
// This does not work:
//
// https://docs.powertools.aws.dev/lambda/java/core/tracing/
//
// The following is not compatible with the above. Use one or
// the other
//
// @XRayEnabled Not seeing any evidence of being enacted here.
@Service
public class ProductService {
    private static final String PRODUCT_SKU = "Product-SKU";
    private static final String OPERATION_NAME = "Operation-Name";
    private static final String OPERATION_TYPE = "Operation-Type";

    @Autowired
    private ProductRepository productRepository;

    private Logger logger = LoggerFactory.getLogger(ProductService.class);

    //@Tracing
    public Product getProductBySku(String productSku) {
        logger.info("Getting product: {}", productSku);
       // TracingUtils.putAnnotation(PRODUCT_SKU, productSku);
       // TracingUtils.putAnnotation(OPERATION_NAME, "getProductBySku");
       // TracingUtils.putAnnotation(OPERATION_TYPE, "JavaFunctionInvoke");
        ProductEntity productEntity = productRepository.findByProductSku(productSku);
        return null != productEntity ? ProductPojoConverter.toProduct(productEntity) : null;

    }

    //@Tracing
    public List<Product> getAllProducts() {
        logger.info("getting all products");
        // TracingUtils.putAnnotation(OPERATION_NAME, "getAllProducts");
        // TracingUtils.putAnnotation(OPERATION_TYPE, "JavaFunctionInvoke");
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
