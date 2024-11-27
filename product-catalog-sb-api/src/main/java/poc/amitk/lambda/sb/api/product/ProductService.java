package poc.amitk.lambda.sb.api.product;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Segment;
import com.amazonaws.xray.spring.aop.XRayEnabled;

import java.time.ZonedDateTime;
import java.util.List;

/**
 * @author amitkapps
 */
@Service
@XRayEnabled
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    private Logger logger = LoggerFactory.getLogger(ProductService.class);

    public Product getProductBySku(String productSku) {
        logger.info("Getting product: {}", productSku);
        try {
            Segment segment = AWSXRay.getCurrentSegment();
            if (segment != null) {
                segment.putAnnotation("ProductSKU", productSku);
                segment.putAnnotation("OperationName", "getProductBySku");
                segment.putAnnotation("OperationType", "JavaFunctionInvoke");
            }
        } catch (Exception e) {
            logger.error("Exception access segment info", e);
        }
        ProductEntity productEntity = productRepository.findByProductSku(productSku);
        return null != productEntity ? ProductPojoConverter.toProduct(productEntity) : null;
    }

    public List<Product> getAllProducts() {
        logger.info("getting all products");
        try {
            Segment segment = AWSXRay.getCurrentSegment();
            if (segment != null) {
                segment.putAnnotation("OperationName", "getAllProducts");
                segment.putAnnotation("OperationType", "JavaFunctionInvoke");
            }
        } catch (Exception e) {
            logger.error("Exception access segment info", e);
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
