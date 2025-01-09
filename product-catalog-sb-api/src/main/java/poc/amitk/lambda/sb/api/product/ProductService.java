package poc.amitk.lambda.sb.api.product;

import java.time.ZonedDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
  
    private final ProductRepository productRepository;

    private Logger logger = LoggerFactory.getLogger(ProductService.class);

    @Autowired    
    public ProductService(ProductRepository myEntityRepository) {        
        this.productRepository = myEntityRepository;    
    }    
    
    public Product getProductBySku(String productSku) {
        logger.info("Getting product: {}", productSku);
        ProductEntity productEntity = productRepository.findByProductSku(productSku);
        return null != productEntity ? ProductPojoConverter.toProduct(productEntity) : null;
    }

    public List<Product> getAllProducts() {
        logger.info("getting all products");        
    //    TracingUtils.putAnnotation("Ernest", "getAllProducts");        
        List<ProductEntity> allProductEntities = productRepository.findAll();
    //    TracingUtils.putMetadata("ErnestMetadata", allProductEntities);
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
