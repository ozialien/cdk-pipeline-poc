package poc.amitk.lambda.sb.api.product;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Segment;

import software.amazon.lambda.powertools.tracing.Tracing;

import java.time.ZonedDateTime;
import java.util.List;

/**
 * @author amitkapps
 */
@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    private Logger logger = LoggerFactory.getLogger(ProductService.class);

    @Tracing(segmentName = "getProductBySku")
    public Product getProductBySku(String productSku){
        logger.info("Getting product: {}", productSku);
        Segment segment = AWSXRay.getCurrentSegment();
        if(segment != null) {
          segment.putAnnotation("ProductSKU", productSku);
          segment.putAnnotation("OperationType", "JavaFunctionInvoke");
        }
        ProductEntity productEntity = productRepository.findByProductSku(productSku);
        return null != productEntity ? ProductPojoConverter.toProduct(productEntity) : null;
    }

    @Tracing(segmentName = "getAllProducts")
    public List<Product> getAllProducts() {
        logger.info("getting all products");
        List<ProductEntity> allProductEntities = productRepository.findAll();
        logger.info("found {} products", allProductEntities.size());
        return allProductEntities.stream()
                .map(ProductPojoConverter::toProduct)
                .toList();
    }

    @Tracing(segmentName = "addProductToCatalog")
    @Transactional
    public Product addProductToCatalog(Product product) {
        logger.info("Adding product {} to catalog", product.getProductSku());
        product.setAddedToCatalogOn(ZonedDateTime.now());
        ProductEntity productEntity = productRepository.save(ProductPojoConverter.toProductEntity(product));
        return ProductPojoConverter.toProduct(productEntity);
    }

    @Tracing(segmentName = "removeProductFromCatalog")
    @Transactional
    public void removeProductFromCatalog(String productSku) {
        logger.info("Removing product {} from catalog", productSku);
        ProductEntity productEntity = new ProductEntity();
        productEntity.setProductSku(productSku);
        productRepository.delete(productEntity);
    }

    @Tracing(segmentName = "removeAllProductsFromCatalog")
    @Transactional
    public void removeAllProductsFromCatalog() {
        logger.info("Removing all products from the catalog");
        productRepository.deleteAll();
    }
}
